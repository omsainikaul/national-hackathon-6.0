"""
Regression tests for DEF-P2-03: Database Write Failure Observability.

Verifies:
1. Successful user creation and updates retain expected behavior.
2. Unexpected user-write failures emit diagnostic logs with non-sensitive identifiers and return False.
3. Expected duplicate/constraint conflicts return False and log at debug level without error noise.
4. Security and account audit log write failures are observable and do not falsely report success.
5. Password reset write failures are observable without leaking reset tokens or password secrets into logs.
6. User lifecycle operations roll back cleanly and log on failure.
"""

import pytest
import logging
from unittest.mock import patch
from database.db import (
    get_db,
    create_user,
    update_user,
    get_user_by_username,
    create_invited_user,
    activate_user_account,
    suspend_user,
    reactivate_user,
    change_user_role,
    revoke_invitation,
    delete_user,
    log_account_audit_event,
    log_security_event,
    create_password_reset_record,
    apply_password_reset,
)
from auth.security import hash_password, ROLE_USER, ROLE_MERCHANT


class MockCursorContext:
    def __init__(self, return_val=None):
        self.return_val = return_val
        self.rowcount = 1
        self.lastrowid = 1

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        pass

    async def fetchone(self):
        return self.return_val

    async def fetchall(self):
        return [self.return_val] if self.return_val else []


class MockDbConnection:
    def __init__(self, execute_side_effect=None, select_return_val=None):
        self.execute_side_effect = execute_side_effect
        self.select_return_val = select_return_val
        self.rollback_called = False
        self.close_called = False

    def execute(self, sql, params=()):
        if self.execute_side_effect:
            if callable(self.execute_side_effect):
                res = self.execute_side_effect(sql, params)
                if isinstance(res, Exception):
                    raise res
            elif isinstance(self.execute_side_effect, Exception):
                raise self.execute_side_effect
        return MockCursorContext(return_val=self.select_return_val)

    async def commit(self):
        pass

    async def rollback(self):
        self.rollback_called = True

    async def close(self):
        self.close_called = True


@pytest.mark.asyncio
async def test_successful_user_creation_and_update():
    """Verify standard user creation and update path works correctly."""
    username = "obs_user_success"
    pw_hash, salt = hash_password("SecurePass123!")
    
    # Ensure cleanup
    await delete_user(username)
    
    ok = await create_user(
        username=username,
        password_hash=pw_hash,
        salt=salt,
        role=ROLE_USER,
        full_name="Observability Test User",
        email="obs_success@test.com",
    )
    assert ok is True
    
    user = await get_user_by_username(username)
    assert user is not None
    assert user["username"] == username
    assert user["full_name"] == "Observability Test User"
    
    # Update user
    update_ok = await update_user(username=username, full_name="Updated Name")
    assert update_ok is True
    
    updated_user = await get_user_by_username(username)
    assert updated_user["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_duplicate_user_creation_handling(caplog):
    """Verify expected duplicate user creation returns False and logs at debug level without error noise."""
    username = "obs_user_dup"
    pw_hash, salt = hash_password("SecurePass123!")
    
    await delete_user(username)
    ok1 = await create_user(username=username, password_hash=pw_hash, salt=salt, role=ROLE_USER)
    assert ok1 is True
    
    caplog.clear()
    with caplog.at_level(logging.DEBUG):
        ok2 = await create_user(username=username, password_hash=pw_hash, salt=salt, role=ROLE_USER)
        assert ok2 is False
        
        # Must log debug message for expected duplicate constraint conflict
        assert any("duplicate constraint conflict" in record.message for record in caplog.records)
        # Must not log at ERROR level
        assert not any(record.levelno >= logging.ERROR for record in caplog.records)


@pytest.mark.asyncio
async def test_unexpected_create_user_failure_logging(caplog):
    """Verify unexpected database error during create_user logs exception context and returns False."""
    username = "obs_user_err"
    secret_pw = "SuperSecretPassword123!"
    pw_hash, salt = hash_password(secret_pw)
    
    mock_db = MockDbConnection(execute_side_effect=RuntimeError("Disk full / I/O failure"))
    
    caplog.clear()
    with patch("database.db.get_db", return_value=mock_db):
        with caplog.at_level(logging.ERROR):
            ok = await create_user(
                username=username,
                password_hash=pw_hash,
                salt=salt,
                role=ROLE_USER,
                email="err@test.com"
            )
            assert ok is False
            assert mock_db.rollback_called is True
            assert mock_db.close_called is True
            
            # Diagnostic log must capture the username and operation
            assert any("create_user" in record.message and username in record.message for record in caplog.records)
            # Secrets must never appear in logs
            for record in caplog.records:
                assert secret_pw not in record.message
                assert pw_hash not in record.message
                assert salt not in record.message


@pytest.mark.asyncio
async def test_unexpected_update_user_failure_logging(caplog):
    """Verify unexpected database error during update_user logs exception context and returns False."""
    username = "obs_user_update_err"
    
    mock_db = MockDbConnection(execute_side_effect=RuntimeError("Database locked"))
    
    caplog.clear()
    with patch("database.db.get_db", return_value=mock_db):
        with caplog.at_level(logging.ERROR):
            ok = await update_user(username=username, full_name="New Name")
            assert ok is False
            assert mock_db.rollback_called is True
            assert mock_db.close_called is True
            
            assert any("update_user" in record.message and username in record.message for record in caplog.records)


@pytest.mark.asyncio
async def test_account_audit_event_failure_logging(caplog):
    """Verify failure in log_account_audit_event logs diagnostic context and returns False."""
    actor = "admin_tester"
    target = "target_user"
    event_type = "USER_ROLE_CHANGED"
    
    mock_db = MockDbConnection(execute_side_effect=RuntimeError("Audit table corrupt"))
    
    caplog.clear()
    with patch("database.db.get_db", return_value=mock_db):
        with caplog.at_level(logging.ERROR):
            ok = await log_account_audit_event(
                actor_username=actor,
                target_username=target,
                event_type=event_type,
                details="Role updated to MERCHANT"
            )
            assert ok is False
            assert mock_db.rollback_called is True
            assert mock_db.close_called is True
            
            assert any(event_type in record.message and target in record.message for record in caplog.records)


@pytest.mark.asyncio
async def test_security_audit_event_failure_logging(caplog):
    """Verify failure in log_security_event logs error context and raises instead of falsely reporting success."""
    event_type = "CRITICAL_UNAUTHORIZED_ACCESS"
    actor = "malicious_actor"
    
    def side_effect(sql, params):
        if "INSERT INTO security_audit_logs" in sql:
            return RuntimeError("Disk write failure")
        return None
    
    mock_db = MockDbConnection(execute_side_effect=side_effect)
    
    caplog.clear()
    with patch("database.db.get_db", return_value=mock_db):
        with caplog.at_level(logging.ERROR):
            with pytest.raises(RuntimeError):
                await log_security_event(
                    event_type=event_type,
                    actor_username=actor,
                    ip_address="203.0.113.1",
                    resource_id="/admin/secrets"
                )
            assert mock_db.rollback_called is True
            assert mock_db.close_called is True
            
            assert any(event_type in record.message and actor in record.message for record in caplog.records)


@pytest.mark.asyncio
async def test_password_reset_record_failure_logging_no_leak(caplog):
    """Verify create_password_reset_record failure logs username without leaking raw token or token hash."""
    username = "obs_reset_user"
    secret_token_hash = "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890"
    
    mock_db = MockDbConnection(execute_side_effect=RuntimeError("DB write error"))
    
    caplog.clear()
    with patch("database.db.get_db", return_value=mock_db):
        with caplog.at_level(logging.ERROR):
            ok = await create_password_reset_record(
                username=username,
                token_hash=secret_token_hash,
                expires_at="2026-12-31T23:59:59Z"
            )
            assert ok is False
            assert mock_db.rollback_called is True
            assert mock_db.close_called is True
            
            # Must log username
            assert any(username in record.message for record in caplog.records)
            # Must NEVER leak token hash
            for record in caplog.records:
                assert secret_token_hash not in record.message


@pytest.mark.asyncio
async def test_apply_password_reset_failure_logging_no_leak(caplog):
    """Verify apply_password_reset failure logs username without leaking new password hash or salt."""
    username = "obs_apply_user"
    new_hash, new_salt = hash_password("NewSecretPassword999!")
    
    mock_db = MockDbConnection(execute_side_effect=RuntimeError("DB deadlock"))
    
    caplog.clear()
    with patch("database.db.get_db", return_value=mock_db):
        with caplog.at_level(logging.ERROR):
            ok = await apply_password_reset(
                username=username,
                reset_id=123,
                new_pw_hash=new_hash,
                new_salt=new_salt
            )
            assert ok is False
            assert mock_db.rollback_called is True
            assert mock_db.close_called is True
            
            # Must log username and reset_id
            assert any(username in record.message and "123" in record.message for record in caplog.records)
            # Must NEVER leak hash or salt
            for record in caplog.records:
                assert new_hash not in record.message
                assert new_salt not in record.message


@pytest.mark.asyncio
async def test_user_lifecycle_failure_logging(caplog):
    """Verify user lifecycle functions log diagnostic context on database failure."""
    username = "obs_lifecycle_user"
    
    mock_db = MockDbConnection(execute_side_effect=RuntimeError("DB constraint error"))
    
    with patch("database.db.get_db", return_value=mock_db):
        with caplog.at_level(logging.ERROR):
            # 1. activate_user_account
            caplog.clear()
            res = await activate_user_account(username, "hash", "salt")
            assert res is False
            assert any(username in r.message for r in caplog.records)
            
            # 2. suspend_user
            caplog.clear()
            res = await suspend_user(username)
            assert res is False
            assert any(username in r.message for r in caplog.records)
            
            # 3. reactivate_user
            caplog.clear()
            res = await reactivate_user(username)
            assert res is False
            assert any(username in r.message for r in caplog.records)
            
            # 4. change_user_role
            caplog.clear()
            res = await change_user_role(username, ROLE_MERCHANT)
            assert res is False
            assert any(username in r.message and ROLE_MERCHANT in r.message for r in caplog.records)
            
            # 5. revoke_invitation
            caplog.clear()
            res = await revoke_invitation(username)
            assert res is False
            assert any(username in r.message for r in caplog.records)
            
            # 6. delete_user
            caplog.clear()
            res = await delete_user(username)
            assert res is False
            assert any(username in r.message for r in caplog.records)

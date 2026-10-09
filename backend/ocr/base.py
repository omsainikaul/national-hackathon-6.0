from abc import ABC, abstractmethod
from models.schemas import OCRResult

class OCREngine(ABC):
    @abstractmethod
    async def extract(self, image_path: str) -> OCRResult:
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        pass

    def is_ready(self) -> bool:
        return self.is_available()

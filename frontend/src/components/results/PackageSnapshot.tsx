import React, { useState } from 'react';
import { FileSearch, ChevronDown, ChevronUp } from 'lucide-react';
import { type ProductInfo } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface PackageSnapshotProps {
  productInfo: ProductInfo;
}

const DataField: React.FC<{ label: string, value: string | null | undefined, truncate?: boolean }> = ({ label, value, truncate }) => {
  if (!value) return null;
  return (
    <div className="bg-slate-50/80 dark:bg-white/[0.02] p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-white/5 transition-colors">
      <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-semibold text-slate-900 dark:text-slate-100 ${truncate ? 'truncate' : 'break-words'}`} title={truncate ? value : undefined}>
        {value}
      </div>
    </div>
  );
};

const PackageSnapshot: React.FC<PackageSnapshotProps> = ({ productInfo = {} as any }) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const info = productInfo || ({} as any);

  const consumerCare = [info.consumer_care_phone, info.consumer_care_email, info.consumer_care]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(' | ');

  return (
    <div className="bg-white dark:bg-[#101A2C] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs mb-6 overflow-hidden">
      <div className="bg-slate-50/80 dark:bg-white/[0.02] p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 text-teal-600 dark:text-teal-400">
            <FileSearch className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            {t('results.package_snapshot', { defaultValue: 'PACKAGE SNAPSHOT' })}
          </span>
        </div>
      </div>
      
      <div className="p-4 sm:p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <DataField label={t('results.fields.brand', { defaultValue: 'Brand' })} value={info.brand} />
        <DataField label={t('results.fields.product_name', { defaultValue: 'Product Name' })} value={info.product_name} truncate />
        <DataField label={t('results.fields.net_quantity', { defaultValue: 'Net Quantity' })} value={info.net_quantity} />
        <DataField label={t('results.fields.mrp', { defaultValue: 'MRP' })} value={info.mrp} />
        <DataField label={t('results.fields.batch_lot', { defaultValue: 'Batch/Lot' })} value={info.batch_number} />
        <DataField label={t('results.fields.expiry_best_before', { defaultValue: 'Expiry/Best Before' })} value={info.expiry_date || info.best_before} />
        <DataField label={t('results.fields.manufacturer', { defaultValue: 'Manufacturer' })} value={info.manufacturer} truncate />
        <DataField label={t('results.fields.fssai_lic_no', { defaultValue: 'FSSAI Lic No' })} value={info.fssai_license} />
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full border-t border-slate-100 dark:border-white/10 p-3 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none"
      >
        {expanded ? (
          <><ChevronUp className="w-4 h-4" /> {t('results.hide_additional_fields', { defaultValue: 'Hide Additional Fields' })}</>
        ) : (
          <><ChevronDown className="w-4 h-4" /> {t('results.show_additional_fields', { defaultValue: 'Show Additional Fields' })}</>
        )}
      </button>

      {expanded && (
        <div className="p-4 sm:p-5 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-white/[0.01]">
          <DataField label={t('results.fields.country_of_origin', { defaultValue: 'Country of Origin' })} value={info.country_of_origin} />
          <DataField label={t('results.fields.marketed_by', { defaultValue: 'Marketed By' })} value={info.marketed_by} />
          <DataField label={t('results.fields.customer_care', { defaultValue: 'Customer Care' })} value={consumerCare || undefined} />
          <DataField label={t('results.fields.ingredients', { defaultValue: 'Ingredients' })} value={info.ingredients} />
          <DataField label={t('results.fields.nutritional_info', { defaultValue: 'Nutritional Info' })} value={info.nutritional_info ? t('results.detected_status', { defaultValue: 'Detected' }) : undefined} />
          <DataField label={t('results.fields.allergen_info', { defaultValue: 'Allergen Info' })} value={info.allergen_info} />
        </div>
      )}
    </div>
  );
};

export default PackageSnapshot;


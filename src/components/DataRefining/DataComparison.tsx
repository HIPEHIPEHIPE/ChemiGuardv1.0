// src/components/DataRefining/DataComparison.tsx - Excel Style Version
import React from 'react';
import ExcelStyleDataGrid from './ExcelStyleDataGrid';
import { ProductWithIngredients } from '../../api/dataRefinement';

interface DataComparisonProps {
  products?: ProductWithIngredients[];
  onRefresh?: () => void;
}

const DataComparison: React.FC<DataComparisonProps> = ({ products, onRefresh }) => {
  return (
    <ExcelStyleDataGrid onRefresh={onRefresh} />
  );
};

export default DataComparison;
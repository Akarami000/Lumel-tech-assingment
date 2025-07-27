import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { data } from '../data'; 

const columnHelper = createColumnHelper();

const Table = () => {
  const [tableData, setTableData] = useState(() => {
    return data.rows.flatMap((parent) => {
      const children = parent.children.map((child) => ({
        id: child.id,
        label: child.label,
        value: child.value,
        baseValue: child.value,
        input: '',
        VariancePer: `${0}%`,
        isChild: true,
        parentId: parent.id,
      }));

      const parentRow = {
        id: parent.id,
        label: parent.label,
        value: children.reduce((sum, c) => sum + c.value, 0),
        baseValue: children.reduce((sum, c) => sum + c.value, 0),
        input: '',
        VariancePer: `${0}%`,
        isChild: false,
      };

      return [parentRow, ...children];
    });
  });

  const handleInputChange = (rowIndex, value) => {
    setTableData((prev) =>
      prev.map((row, i) =>
        i === rowIndex ? { ...row, input: value } : row
      )
    );
  };

  const updateParentValues = (updatedRows, childRow) => {
    const parentIndex = updatedRows.findIndex(
      (row) => row.id === childRow.parentId && !row.isChild
    );

    if (parentIndex !== -1) {
      const updatedValue = updatedRows
        .filter((r) => r.isChild && r.parentId === childRow.parentId)
        .reduce((sum, r) => sum + r.value, 0);
        const updatedVariencePer = ((updatedValue - updatedRows[parentIndex].baseValue) / updatedRows[parentIndex].baseValue) * 100;

      updatedRows[parentIndex] = {
        ...updatedRows[parentIndex],
        value: parseFloat(updatedValue.toFixed(2)),
        VariancePer: updatedVariencePer.toFixed(2) + '%',
      };
    }

    return updatedRows;
  };

  const handleAllocateClickPer = (rowIndex) => {
    setTableData((prev) => {
      const updated = [...prev];
      const row = updated[rowIndex];
      const percent = parseFloat(row.input);

      if (!isNaN(percent)) {
        const delta = (percent / 100) * row.baseValue;
        row.value = parseFloat((row.baseValue + delta).toFixed(2));
        row.VariancePer = `${percent.toFixed(2)}%`;
        return updateParentValues(updated, row);
      }

      return updated;
    });
  };
const handleAllocateClickVal = (rowIndex) => {
  setTableData((prev) => {
    const updated = [...prev];
    const row = updated[rowIndex];
    const inputVal = parseFloat(row.input);

    if (!isNaN(inputVal)) {
      if (!row.isChild) {
        const parentId = row.id;

        const childRows = updated.filter(
          (r) => r.isChild && r.parentId === parentId
        );

        const totalChildBase = childRows.reduce(
          (sum, child) => sum + child.baseValue,
          0
        );

        childRows.forEach((child) => {
          const contributionRatio = child.baseValue / totalChildBase;
          const newChildValue = parseFloat((inputVal * contributionRatio).toFixed(2));
          const variance = ((newChildValue - child.baseValue) / child.baseValue) * 100;

          child.value = newChildValue;
          child.VariancePer = `${variance.toFixed(2)}%`;
        });

        row.value = parseFloat(inputVal.toFixed(2));
        row.VariancePer = `${((inputVal - row.baseValue) / row.baseValue * 100).toFixed(2)}%`;

        return updated;
      }

      const variance = ((inputVal - row.baseValue) / row.baseValue) * 100;
      row.value = parseFloat(inputVal.toFixed(2));
      row.VariancePer = `${variance.toFixed(2)}%`;

      return updateParentValues(updated, row);
    }

    return updated;
  });
};
  const columns = useMemo(
    () => [
      columnHelper.accessor('label', {
        header: 'Label',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('value', {
        header: 'Current Value',
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: 'input',
        header: 'Input',
        cell: (info) => (
          <input
            type="text"
            value={tableData[info.row.index].input}
            onChange={(e) =>
              handleInputChange(info.row.index, e.target.value)
            }
            style={{ width: '70%' }}
          />
        ),
      }),
      columnHelper.display({
        id: 'AllocationPer',
        header: 'Allocate %',
        cell: (info) => (
          <button onClick={() => handleAllocateClickPer(info.row.index)}>
            Allocate %
          </button>
        ),
      }),
      columnHelper.display({
        id: 'AllocationVal',
        header: 'Allocate Val',
        cell: (info) => (
          <button onClick={() => handleAllocateClickVal(info.row.index)}>
            Allocate Val
          </button>
        ),
      }),
      columnHelper.accessor('VariancePer', {
        header: 'Variance %',
        cell: (info) => info.getValue(),
      }),
    ],
    [tableData]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div style={{ padding: 20 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{
                    border: '1px solid #ccc',
                    padding: '8px',
                    background: '#f9f9f9',
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              style={{
                background: tableData[row.index].isChild ? '#fefefe' : '#eef2f5',
                fontWeight: tableData[row.index].isChild ? 'normal' : 'bold',
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{
                    border: '1px solid #ddd',
                    padding: '8px',
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
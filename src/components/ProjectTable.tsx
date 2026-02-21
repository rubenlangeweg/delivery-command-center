import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import type { ProjectHealth } from '../types'
import { HealthBadge } from './HealthBadge'
import { BudgetProgress } from './BudgetProgress'

interface ProjectTableProps {
  projects: ProjectHealth[]
}

const columnHelper = createColumnHelper<ProjectHealth>()

export function ProjectTable({ projects }: ProjectTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = useMemo(
    () => [
      columnHelper.accessor('health', {
        header: 'Health',
        cell: info => <HealthBadge status={info.getValue()} />,
        size: 100,
      }),
      columnHelper.accessor('name', {
        header: 'Project',
        cell: info => (
          <div className="font-medium text-gray-900">{info.getValue()}</div>
        ),
        size: 250,
      }),
      columnHelper.accessor('budget.percentage', {
        header: 'Budget %',
        cell: info => <BudgetProgress percentage={info.getValue()} />,
        sortDescFirst: true,
        size: 150,
      }),
      columnHelper.accessor('budget.allocated', {
        header: 'Budget',
        cell: info => {
          const row = info.row.original
          return (
            <div className="text-sm">
              <div className="font-medium">
                EUR {(row.budget.forecast / 1000).toFixed(0)}K / {(row.budget.allocated / 1000).toFixed(0)}K
              </div>
              <div className="text-gray-500 text-xs">
                Spent: EUR {(row.budget.spent / 1000).toFixed(0)}K
              </div>
            </div>
          )
        },
        size: 150,
      }),
      columnHelper.accessor('pmGovernance.percentage', {
        header: 'PM %',
        cell: info => {
          const value = info.getValue()
          const compliant = info.row.original.pmGovernance.compliant
          return (
            <div
              className={`text-sm font-medium ${
                compliant ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {value.toFixed(1)}%
            </div>
          )
        },
        sortDescFirst: true,
        size: 80,
      }),
      columnHelper.accessor('linear.sprintLoad', {
        header: 'Sprint Load',
        cell: info => {
          const value = info.getValue()
          const overbooked = info.row.original.linear.overbooked
          return (
            <div
              className={`text-sm font-medium ${
                overbooked ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {value > 0 ? `${value}%` : '-'}
            </div>
          )
        },
        sortDescFirst: true,
        size: 100,
      }),
      columnHelper.accessor('team.size', {
        header: 'Team',
        cell: info => (
          <div className="text-sm text-gray-900">{info.getValue()} people</div>
        ),
        size: 80,
      }),
      columnHelper.accessor('alerts', {
        header: 'Alerts',
        cell: info => {
          const alerts = info.getValue()
          const critical = alerts.filter(a => a.severity === 'critical').length
          const warnings = alerts.filter(a => a.severity === 'warning').length
          return (
            <div className="flex gap-2 text-xs">
              {critical > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                  {critical} critical
                </span>
              )}
              {warnings > 0 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                  {warnings} warning{warnings > 1 ? 's' : ''}
                </span>
              )}
              {alerts.length === 0 && (
                <span className="text-gray-400">None</span>
              )}
            </div>
          )
        },
        enableSorting: false,
        size: 150,
      }),
    ],
    []
  )

  const table = useReactTable({
    data: projects,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ width: header.getSize() }}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() && (
                      <span>{header.column.getIsSorted() === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.getRowModel().rows.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No projects found
        </div>
      )}
    </div>
  )
}

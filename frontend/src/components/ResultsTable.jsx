/**
 * ResultsTable.jsx
 * ----------------
 * Paginated, sortable data table that highlights anomaly rows in red.
 * Shows the 'anomaly' and 'score' columns prominently.
 */

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import styles from './ResultsTable.module.css'

const PAGE_SIZE = 15

export default function ResultsTable({ data, columns }) {
  const [page, setPage] = useState(1)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  // Sort data
  const sorted = useMemo(() => {
    if (!sortCol) return data
    return [...data].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      return sortDir === 'asc'
        ? (av < bv ? -1 : av > bv ? 1 : 0)
        : (av > bv ? -1 : av < bv ? 1 : 0)
    })
  }, [data, sortCol, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageData   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setPage(1)
  }

  const formatCell = (val) => {
    if (val === null || val === undefined) return <span className={styles.null}>—</span>
    if (typeof val === 'number') return Number.isInteger(val) ? val : val.toFixed(4)
    return String(val)
  }

  // Pin 'anomaly' and 'score' columns last
  const orderedCols = useMemo(() => {
    const special = ['anomaly', 'score']
    const rest = columns.filter(c => !special.includes(c))
    return [...rest, ...special.filter(c => columns.includes(c))]
  }, [columns])

  return (
    <div className={styles.wrapper}>
      {/* Table scroll container */}
      <div className={styles.scrollContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.indexCol}`}>#</th>
              {orderedCols.map(col => (
                <th
                  key={col}
                  className={`${styles.th} ${col === 'anomaly' ? styles.anomalyHeader : ''} ${col === 'score' ? styles.scoreHeader : ''}`}
                  onClick={() => handleSort(col)}
                  aria-sort={sortCol === col ? sortDir : 'none'}
                >
                  <span className={styles.thInner}>
                    {col}
                    <ArrowUpDown size={12} className={styles.sortIcon} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, idx) => {
              const isAnomaly = row.anomaly === -1
              const globalIdx = (page - 1) * PAGE_SIZE + idx + 1
              return (
                <tr
                  key={idx}
                  className={`${styles.tr} ${isAnomaly ? styles.anomalyRow : ''}`}
                >
                  <td className={`${styles.td} ${styles.indexCol}`}>{globalIdx}</td>
                  {orderedCols.map(col => (
                    <td key={col} className={`${styles.td} ${col === 'anomaly' ? styles.anomalyCell : ''}`}>
                      {col === 'anomaly' ? (
                        <span className={`badge ${isAnomaly ? 'badge-anomaly' : 'badge-normal'}`}>
                          {row[col] === -1 ? '⚠ Anomaly' : '✓ Normal'}
                        </span>
                      ) : (
                        formatCell(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Rows {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className={styles.pageControls}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className={styles.pageLabel}>{page} / {totalPages}</span>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

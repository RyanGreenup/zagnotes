import { Note, Folder, Tag, Resource } from '../../shared/types'
import BetterSqlite3 from 'better-sqlite3'

export interface Database {
  prepare: (sql: string) => Statement
  exec: (sql: string) => void
  close: () => void
}

export interface Statement {
  run: (...params: any[]) => { changes: number; lastInsertRowid: number }
  get: (...params: any[]) => any
  all: (...params: any[]) => any[]
  iterate: (...params: any[]) => Iterable<any>
}

export interface TreeNode {
  id: string
  name: string
  type: "file" | "folder"
  children?: TreeNode[]
}

export interface DatabaseOptions {
  readonly?: boolean
}

export interface DatabaseStatus {
  connected: boolean
  path: string | null
}

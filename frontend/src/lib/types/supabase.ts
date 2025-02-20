export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: number
          title: string
          description: string
          status: string
          priority: string
          category: string
          due_date: string | null
          created_at: string
          updated_at: string
          created_by: string
          assigned_to: string | null
          ai_suggestions: Json | null
        }
        Insert: {
          id?: number
          title: string
          description: string
          status?: string
          priority?: string
          category?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
          assigned_to?: string | null
          ai_suggestions?: Json | null
        }
        Update: {
          id?: number
          title?: string
          description?: string
          status?: string
          priority?: string
          category?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
          assigned_to?: string | null
          ai_suggestions?: Json | null
        }
      }
    }
  }
} 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      doubts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body_markdown: string;
          subject: string;
          subtopics: string[];
          difficulty: Database["public"]["Enums"]["difficulty_enum"];
          error_tags: string[];
          is_cleared: boolean;
          created_at: string;
          updated_at: string;
          search_vector: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body_markdown: string;
          subject: string;
          subtopics?: string[];
          difficulty: Database["public"]["Enums"]["difficulty_enum"];
          error_tags?: string[];
          is_cleared?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body_markdown?: string;
          subject?: string;
          subtopics?: string[];
          difficulty?: Database["public"]["Enums"]["difficulty_enum"];
          error_tags?: string[];
          is_cleared?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      doubt_attachments: {
        Row: {
          id: string;
          doubt_id: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          doubt_id: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          doubt_id?: string;
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "doubt_attachments_doubt_id_fkey";
            columns: ["doubt_id"];
            isOneToOne: false;
            referencedRelation: "doubts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      difficulty_enum: "easy" | "medium" | "hard";
    };
    CompositeTypes: Record<string, never>;
  };
};

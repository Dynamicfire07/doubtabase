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
          room_id: string;
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
          room_id: string;
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
          room_id?: string;
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
        Relationships: [
          {
            foreignKeyName: "doubts_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
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
      rooms: {
        Row: {
          id: string;
          name: string;
          is_personal: boolean;
          owner_user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_personal?: boolean;
          owner_user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_personal?: boolean;
          owner_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      room_members: {
        Row: {
          room_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["room_role_enum"];
          created_at: string;
        };
        Insert: {
          room_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["room_role_enum"];
          created_at?: string;
        };
        Update: {
          room_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["room_role_enum"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      room_invites: {
        Row: {
          id: string;
          room_id: string;
          token_hash: string;
          created_by_user_id: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          token_hash: string;
          created_by_user_id: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          token_hash?: string;
          created_by_user_id?: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_invites_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_room_member: {
        Args: {
          target_room_id: string;
          target_user_id: string;
        };
        Returns: boolean;
      };
      is_room_owner: {
        Args: {
          target_room_id: string;
          target_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      difficulty_enum: "easy" | "medium" | "hard";
      room_role_enum: "owner" | "member";
    };
    CompositeTypes: Record<string, never>;
  };
};

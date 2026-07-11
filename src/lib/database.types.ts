export type MediaType = "photo" | "video" | "audio";
export type MemoryTheme =
  | "joy"
  | "achievement"
  | "growth"
  | "gratitude"
  | "connection"
  | "adventure"
  | "calm";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Moment {
  id: string;
  user_id: string;
  body: string;
  themes: MemoryTheme[];
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface MomentTag {
  moment_id: string;
  tag_id: string;
  created_at: string;
}

export interface MediaAttachment {
  id: string;
  moment_id: string;
  user_id: string;
  media_type: MediaType;
  display_order: number;
  storage_path: string;
  thumbnail_path: string | null;
  mime_type: string;
  file_size_bytes: number;
  original_filename: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          display_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      moments: {
        Row: Moment;
        Insert: {
          id?: string;
          user_id: string;
          body: string;
          themes?: MemoryTheme[];
          occurred_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          themes?: MemoryTheme[];
          occurred_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: Tag;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      moment_tags: {
        Row: MomentTag;
        Insert: {
          moment_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [];
      };
      media_attachments: {
        Row: MediaAttachment;
        Insert: {
          id?: string;
          moment_id: string;
          user_id: string;
          media_type: MediaType;
          display_order?: number;
          storage_path: string;
          thumbnail_path?: string | null;
          mime_type: string;
          file_size_bytes: number;
          original_filename?: string | null;
          created_at?: string;
        };
        Update: {
          media_type?: MediaType;
          display_order?: number;
          storage_path?: string;
          thumbnail_path?: string | null;
          mime_type?: string;
          file_size_bytes?: number;
          original_filename?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      search_moment_ids: {
        Args: {
          p_query: string;
          p_tag_ids?: string[] | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          rank: number;
        }[];
      };
      on_this_day_moment_ids: {
        Args: {
          p_month: number;
          p_day: number;
          p_year: number;
          p_limit?: number;
        };
        Returns: {
          id: string;
          occurred_at: string;
        }[];
      };
      resurface_moment_ids: {
        Args: {
          p_themes: MemoryTheme[];
          p_media_type?: MediaType | null;
          p_limit?: number;
        };
        Returns: {
          id: string;
          match_source: "theme" | "content";
          rank: number;
        }[];
      };
    };
    Enums: {
      media_type: MediaType;
      memory_theme: MemoryTheme;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

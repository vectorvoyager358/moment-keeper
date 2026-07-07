export type MediaType = "photo" | "video" | "audio";

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
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  original_filename: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, "id">>;
      };
      moments: {
        Row: Moment;
        Insert: Omit<Moment, "id" | "created_at" | "updated_at"> & {
          id?: string;
          occurred_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Moment, "id" | "user_id">>;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Tag, "id" | "user_id">>;
      };
      moment_tags: {
        Row: MomentTag;
        Insert: Omit<MomentTag, "created_at"> & { created_at?: string };
        Update: never;
      };
      media_attachments: {
        Row: MediaAttachment;
        Insert: Omit<MediaAttachment, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Omit<MediaAttachment, "id" | "moment_id" | "user_id" | "created_at">
        >;
      };
    };
    Enums: {
      media_type: MediaType;
    };
  };
}

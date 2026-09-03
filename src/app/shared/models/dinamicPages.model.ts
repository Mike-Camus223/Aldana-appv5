export interface GenericDataPage {
  id: string;
  page_slug: string;
  generic_data_sections: GenericDataSection[];
}

export interface GenericDataSection {
  id: string;
  section_order: number;
  generic_data_contents: GenericDataContent[];
}

export interface GenericDataContent {
  id: string;
  content_type: 'title' | 'paragraph' | 'image' | 'video' | 'button' | 'icon';
  content_order: number;
  content_text: string | null;
  image_url: string | null;
  video_url: string | null;
  is_main: boolean;
}

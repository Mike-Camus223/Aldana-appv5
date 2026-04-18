import { inject, Injectable } from "@angular/core";
import { getDataHelperService } from "../getDataHelper.service";

@Injectable({ providedIn: 'root' })
export class CollectionBridesService {
    private dataHelper = inject(getDataHelperService)


    async getCollectionBrides() {
        const selectFieldsCollectionBrides = `
            id,
            uuid,
            name,
            cover_image_url,
            season,
            release_date,
            created_at,
            banner,
            description,
            slug
            `;

        const result = await this.dataHelper.getData<any[]>(
            'collection_brides',
            selectFieldsCollectionBrides
        );

        if (result.error) throw result.error;
        return result.data;
    }

    async getCollectionBridesBySlug(slug: string) {
        const selectFieldsCollectionBrides = `
            id,
            uuid,
            name,
            cover_image_url,
            season,
            release_date,
            created_at,
            banner,
            description,
            slug
        `;

        const result = await this.dataHelper.getData<any[]>(
            'collection_brides',
            selectFieldsCollectionBrides,
            'slug',
            slug,
            true
        );

        if (result.error) throw result.error;
        return result.data;
    }

    async getCollectionBridesItemsByCollectionId(collectionId: string) {
        const selectFields = `
            id,
            collection_id,
            product_id,
            title,
            subtitle,
            description,
            slug,
            "order",
            created_at,
            collection_media_brides_items (
                id,
                media_group,
                media_url,
                alt,
                type,
                "order",
                created_at,
                poster_url,
                collection_item_id
            )
        `;

        const { data, error } = await this.dataHelper.client
            .from('collection_brides_items')
            .select(selectFields)
            .eq('collection_id', collectionId)
            .order('order', { ascending: true });

        if (error) throw error;
        return data as any[];
    }

    async getCollectionBridesItemDetail(collectionId: string, itemSlug: string) {
        const selectFields = `
            id,
            collection_id,
            product_id,
            title,
            subtitle,
            description,
            slug,
            "order",
            created_at,
            collection_media_brides_items (
                id,
                media_group,
                media_url,
                alt,
                type,
                "order",
                created_at,
                poster_url,
                collection_item_id
            )
        `;

        const { data, error } = await this.dataHelper.client
            .from('collection_brides_items')
            .select(selectFields)
            .eq('collection_id', collectionId)
            .eq('slug', itemSlug)
            .maybeSingle();

        if (error) throw error;
        return data as any | null;
    }
}
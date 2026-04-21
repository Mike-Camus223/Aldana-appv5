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
        const { data, error } = await this.dataHelper.client
            .from('pbrides_product_collections')
            .select(`
                id,
                product_id,
                collection_id,
                pbrides_products (
                    id,
                    name,
                    slug,
                    description,
                    details,
                    main_image,
                    media,
                    price
                )
            `)
            .eq('collection_id', collectionId);

        if (error) throw error;
        return data as any[];
    }

    async getCollectionBridesItemDetail(collectionId: string, productSlug: string) {
        const { data, error } = await this.dataHelper.client
            .from('pbrides_product_collections')
            .select(`
                id,
                product_id,
                collection_id,
                pbrides_products!inner (
                    id,
                    name,
                    slug,
                    description,
                    details,
                    main_image,
                    media,
                    price,
                    pbrides_product_variants (
                        id,
                        color_name,
                        color_hex,
                        avid,
                        main_image,
                        media
                    )
                )
            `)
            .eq('collection_id', collectionId)
            .eq('pbrides_products.slug', productSlug)
            .maybeSingle();

        if (error) throw error;
        return data as any | null;
    }
}
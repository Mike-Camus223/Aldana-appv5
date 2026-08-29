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
            slug,
            department
        `;

        const { data, error } = await this.dataHelper.client
            .from('collections')
            .select(selectFieldsCollectionBrides)
            .eq('department', 'bridal')
            .order('release_date', { ascending: false });

        if (error) throw error;
        return data as any[];
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
            slug,
            department
        `;

        const { data, error } = await this.dataHelper.client
            .from('collections')
            .select(selectFieldsCollectionBrides)
            .eq('slug', slug)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async getCollectionBridesItemsByCollectionId(collectionId: string) {
        const { data, error } = await this.dataHelper.client
            .from('product_collections')
            .select(`
                id,
                product_id,
                collection_id,
                display_order,
                products (
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
            .eq('collection_id', collectionId)
            .order('display_order', { ascending: true });

        if (error) throw error;
        // Map to keep backward-compatible shape for components expecting .pbrides_products
        return (data || []).map((item: any) => ({
            ...item,
            pbrides_products: item.products || item.pbrides_products
        })) as any[];
    }

    async getCollectionBridesItemDetail(collectionId: string, productSlug: string) {
        const { data, error } = await this.dataHelper.client
            .from('product_collections')
            .select(`
                id,
                product_id,
                collection_id,
                products!inner (
                    id,
                    name,
                    slug,
                    description,
                    details,
                    main_image,
                    media,
                    price,
                    product_variants (
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
            .eq('products.slug', productSlug)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const prod = (data as any).products;
        return {
            ...data,
            pbrides_products: {
                ...prod,
                pbrides_product_variants: prod?.product_variants || []
            }
        } as any;
    }
}
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
            slug,
            collection_media_brides (
            id,
            collection_id,
            section_name,
            media_url,
            alt,
            type,
            order,
            created_at,
            poster_url
            )
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
}
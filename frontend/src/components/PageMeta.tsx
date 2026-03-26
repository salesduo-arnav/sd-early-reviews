import { Helmet } from 'react-helmet-async';

interface PageMetaProps {
    title: string;
    description?: string;
}

const SITE_NAME = 'SalesDuo Early Reviews';

export function PageMeta({ title, description }: PageMetaProps) {
    const fullTitle = `${title} | ${SITE_NAME}`;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            {description && <meta name="description" content={description} />}
            <meta property="og:title" content={fullTitle} />
            {description && <meta property="og:description" content={description} />}
            <meta name="twitter:title" content={fullTitle} />
            {description && <meta name="twitter:description" content={description} />}
        </Helmet>
    );
}

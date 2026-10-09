interface ImportMetaEnv {
  /** The address Kast is deployed at, for canonical links and the sitemap. */
  readonly PUBLIC_SITE_URL?: string;
  /** The public repository of the deployed code (AGPL-3.0, section 13). */
  readonly PUBLIC_SOURCE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

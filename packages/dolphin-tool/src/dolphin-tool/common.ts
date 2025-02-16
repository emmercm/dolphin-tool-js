export enum ContainerFormat {
  ISO = 'iso',
  GCZ = 'gcz',
  WIA = 'wia',
  RVZ = 'rvz',
}

export enum CompressionMethodWiaRvz {
  NONE = 'none',
  ZSTD = 'zstd',
  BZIP2 = 'bzip2',
  LZMA = 'lzma',
  LZMA2 = 'lzma2',
}

export enum CompressionMethodGcz {
  DEFLATE = 'deflate',
}

export type CompressionMethod = CompressionMethodWiaRvz | CompressionMethodGcz;

export enum DigestAlgorithm {
  CRC32 = 'crc32',
  MD5 = 'md5',
  SHA1 = 'sha1',
  RCHASH = 'rchash',
}

import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

export const uqloadsScraper = makeEmbed({
  id: 'uqloads',
  name: 'Uqloads',
  rank: 1000,
  async scrape(ctx) {
    const embed = await ctx.fetcher<string>(ctx.url, {
      headers: {
        referer: 'https://2embed.cc',
      },
    });
    const embedHtml = load(embed);

    const sourceUrl = embedHtml('script')
      .text()
      .match(/sources: \[{file:"(.*?)"/)?.[1];
    if (!sourceUrl) throw new Error("Couldn't find stream url");

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: sourceUrl,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});

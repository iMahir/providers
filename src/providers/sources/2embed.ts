import { load } from 'cheerio';

import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const twoembedBase = 'https://2embed.cc';

async function universalScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const { media, proxiedFetcher } = ctx;

  let twoembedUrl = `${twoembedBase}/embed/${media.tmdbId}`;
  if (media.type === 'show')
    twoembedUrl = `${twoembedBase}/embedtv/${media.tmdbId}&s=${media.season}&e=${media.episode}`;

  const page = await proxiedFetcher<any>(twoembedUrl);
  const twoembedPage = load(page);

  const links = twoembedPage('#myDropdown a');

  // Possible embed providers: 9ani, 2embed, Vsrc, smstrm, MovPi, Gdrive
  const embedLinks: { name: string; url?: string }[] = [];

  links.each((index, element) => {
    const name = twoembedPage(element).text().trim();
    const url = twoembedPage(element)
      .attr('onclick')
      ?.match(/'(.*?)'/)?.[1];

    embedLinks.push({ name, url });
  });

  /*
  First get inner embed url: https://streamsrcs.2embed.cc/swish/...
  Then get other embed id from inner embed to form final embed url
  https://uqloads.xyz/e/{id}
  */
  const innterEmbedUrl = embedLinks.find((link) => link.name === '2embed')?.url;
  if (!innterEmbedUrl) throw new NotFoundError("Couldn't find 2embed link");

  const innerEmbedPage = await proxiedFetcher<any>(innterEmbedUrl);
  const innerEmbedPageHtml = load(innerEmbedPage);

  const embedId = innerEmbedPageHtml('iframe').attr('src');
  if (!embedId) throw new NotFoundError("Couldn't find embed id");

  return {
    embeds: [
      {
        embedId: 'uqloads',
        url: `https://uqloads.xyz/e/${embedId}`,
      },
    ],
  };
}

export const twoembedScraper = makeSourcerer({
  id: '2embed',
  name: '2Embed',
  rank: 1000,
  flags: [],
  scrapeMovie: universalScraper,
  scrapeShow: universalScraper,
});

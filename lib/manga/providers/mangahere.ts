import { Manga, Chapter, MangaPage } from '@consumet/extensions'; // Adjust import based on your actual library path, usually @consumet/extensions or local interface
import axios from 'axios';
import * as cheerio from 'cheerio';

export class MangaHere {
  private readonly baseUrl = 'https://www.mangahere.cc';
  private readonly client = axios.create({
    baseURL: this.baseUrl,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.mangahere.cc/',
      'Cookie': 'isAdult=1', // Bypasses age checks
    },
  });

  async search(query: string) {
    try {
      const { data } = await this.client.get(`/search?title=${encodeURIComponent(query)}`);
      const $ = cheerio.load(data);
      const results: any[] = [];

      $('.manga-list-1-list li').each((i, el) => {
        const title = $(el).find('a').attr('title');
        const id = $(el).find('a').attr('href')?.split('/manga/')[1]?.replace('/', '');
        const image = $(el).find('img').attr('src');

        if (id && title) {
          results.push({
            id: id,
            title: title.trim(),
            image: image,
            provider: 'mangahere'
          });
        }
      });
      return results;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async fetchMangaInfo(mangaId: string) {
    try {
      const { data } = await this.client.get(`/manga/${mangaId}/`);
      const $ = cheerio.load(data);

      const title = $('.detail-info-right-title-font').text().trim();
      const image = $('.detail-info-cover-img').attr('src');
      const description = $('.detail-info-right-content').text().trim();
      
      const chapters: any[] = [];
      
      // FIX: Robust logic for chapter IDs (Handles both Volume and No-Volume URLs)
      $('.detail-main-list li a').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          const title = $(el).find('.title3').text().trim();
          // Extract everything after the manga ID and before /1.html
          // Example 1: /manga/one_piece/v98/c1170/1.html -> v98/c1170
          // Example 2: /manga/urban_leveling/c139/1.html -> c139
          const idMatch = href.match(new RegExp(`/manga/${mangaId}/(.*?)/1.html`));
          const id = idMatch ? idMatch[1] : null;

          if (id) {
            chapters.push({
              id: id, // This ID preserves the structure needed for fetching pages
              title: title || `Chapter ${chapters.length + 1}`,
              number: chapters.length + 1 // Simple ordering
            });
          }
        }
      });

      return {
        id: mangaId,
        title,
        image,
        description,
        chapters: chapters.reverse() // Often listed newest first, reversing for logical order
      };
    } catch (e) {
      throw new Error(`Failed to fetch manga info: ${e}`);
    }
  }

  async fetchChapterPages(chapterId: string, mangaId: string) {
    try {
      // Reconstruct URL using the stored ID (which includes vXX/cXX or just cXX)
      const url = `/manga/${mangaId}/${chapterId}/1.html`;
      const { data } = await this.client.get(url);
      const $ = cheerio.load(data);

      const pages: string[] = [];
      
      // MangaHere loads scripts that define `imagecount`. We need to extract it.
      const scriptContent = $('script').map((i, el) => $(el).html()).get().join(' ');
      
      // Extract the total page count variable
      const countMatch = scriptContent.match(/var imagecount\s*=\s*(\d+);/);
      const imageCount = countMatch ? parseInt(countMatch[1]) : 0;

      // Extract the chapter ID (cid) used for API calls if needed, 
      // but usually MangaHere uses a predictable URL pattern for images:
      // http://[host]/[path]/chapter_id/page_number.jpg
      // However, scraping the 'imageurl' array from script is more reliable.
      
      // Strategy: Use the mobile API endpoint or parse the script image array
      // Simplest robust method for MangaHere:
      // They often expose `pvalue` (images paths).
      
      // Let's try parsing the `pvalue` variable from scripts which usually contains image paths
      const pvalueMatch = scriptContent.match(/var pvalue\s*=\s*\[(.*?)\];/);
      
      if (pvalueMatch && pvalueMatch[1]) {
         // Clean and split the URLs
         const rawUrls = pvalueMatch[1].replace(/"/g, '').split(',');
         // MangaHere uses a CDN base that might change, but the URLs in pvalue are often relative or protocol-less
         // We need to verify the domain. Usually extracted from `var domain`
         const domainMatch = scriptContent.match(/var domain\s*=\s*"(.*?)";/);
         const domain = domainMatch ? domainMatch[1] : 'https://fmcdn.mangahere.com/'; // Fallback

         rawUrls.forEach(path => {
             if (path.startsWith('//')) {
                 pages.push(`https:${path}`);
             } else if (path.startsWith('http')) {
                 pages.push(path);
             } else {
                 pages.push(`${domain}${path}`);
             }
         });
      }

      // Fallback: If script parsing fails, loop manually (slower)
      if (pages.length === 0 && imageCount > 0) {
          // This part is tricky because we need the image source, not just the page HTML URL.
          // For simplicity, we stick to the script extraction above which is standard for MangaHere.
      }

      return pages.map(url => ({ img: url }));
    } catch (e) {
      console.error(e);
      return [];
    }
  }
}

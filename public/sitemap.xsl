<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="ko">
      <head>
        <title>Sitemap - Cuddle Market</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f8f9fa;
            color: #333;
            padding: 2rem;
          }
          .container { max-width: 1000px; margin: 0 auto; }
          h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
          }
          .description {
            color: #666;
            font-size: 0.875rem;
            margin-bottom: 1.5rem;
          }
          .stats {
            display: flex;
            gap: 1.5rem;
            margin-bottom: 1.5rem;
          }
          .stat {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.75rem 1.25rem;
          }
          .stat-value { font-size: 1.25rem; font-weight: 700; color: #4f46e5; }
          .stat-label { font-size: 0.75rem; color: #888; }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          th {
            background: #f1f5f9;
            text-align: left;
            padding: 0.625rem 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          td {
            padding: 0.5rem 1rem;
            font-size: 0.8125rem;
            border-top: 1px solid #f1f5f9;
          }
          tr:hover td { background: #f8fafc; }
          td a {
            color: #4f46e5;
            text-decoration: none;
            word-break: break-all;
          }
          td a:hover { text-decoration: underline; }
          .priority {
            display: inline-block;
            padding: 0.125rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          .priority-high { background: #dbeafe; color: #1d4ed8; }
          .priority-mid { background: #e0e7ff; color: #4338ca; }
          .priority-low { background: #f1f5f9; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Sitemap</h1>
          <p class="description">
            검색 엔진 크롤러를 위한 사이트맵입니다. 이 페이지는 XSL 스타일시트로 보기 좋게 렌더링되었습니다.
          </p>
          <div class="stats">
            <div class="stat">
              <div class="stat-value"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></div>
              <div class="stat-label">Total URLs</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 3rem">#</th>
                <th>URL</th>
                <th style="width: 7rem">Last Modified</th>
                <th style="width: 5.5rem">Frequency</th>
                <th style="width: 4.5rem">Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td style="color: #94a3b8;"><xsl:value-of select="position()"/></td>
                  <td>
                    <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                  </td>
                  <td style="color: #64748b; font-size: 0.75rem;">
                    <xsl:if test="sitemap:lastmod">
                      <xsl:value-of select="substring(sitemap:lastmod, 1, 10)"/>
                    </xsl:if>
                  </td>
                  <td style="color: #64748b;">
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td>
                    <xsl:choose>
                      <xsl:when test="sitemap:priority &gt;= 0.8">
                        <span class="priority priority-high"><xsl:value-of select="sitemap:priority"/></span>
                      </xsl:when>
                      <xsl:when test="sitemap:priority &gt;= 0.6">
                        <span class="priority priority-mid"><xsl:value-of select="sitemap:priority"/></span>
                      </xsl:when>
                      <xsl:otherwise>
                        <span class="priority priority-low"><xsl:value-of select="sitemap:priority"/></span>
                      </xsl:otherwise>
                    </xsl:choose>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>

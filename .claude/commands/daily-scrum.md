# DAILY SCRUM 페이지 생성

오늘 날짜로 DAILY SCRUM 데이터베이스에 새로운 페이지를 생성하고 내용을 채워주세요.

## 작업 순서

1. **오늘 날짜 확인**: 오늘이 몇 월 몇 일인지 확인

2. **DAILY SCRUM 데이터베이스에 페이지 생성 (curl 사용 필수)**

   > **중요**: MCP Notion 도구의 `API-post-page`는 `parent.page_id`만 지원하여 데이터베이스에 직접 페이지를 생성할 수 없습니다. 반드시 아래 curl 명령어를 사용하세요.

   > **API Token 확인 방법**: MCP 로그 파일에서 토큰 확인
   > `cat ~/Library/Caches/claude-cli-nodejs/-Users-osejin-Desktop-cuddle-market/mcp-logs-notion/*.txt | grep "Authorization: Bearer" | head -1`

   ```bash
   curl -X POST 'https://api.notion.com/v1/pages' \
     -H "Authorization: Bearer {NOTION_API_TOKEN}" \
     -H "Content-Type: application/json" \
     -H "Notion-Version: 2022-06-28" \
     -d '{
       "parent": {
         "database_id": "2fc26170-466f-80e2-999f-cf5ac1963e2f"
       },
       "properties": {
         "이름": {
           "title": [{"text": {"content": "YYYY년 MM월 DD일"}}]
         },
         "작성일시": {
           "date": {"start": "YYYY-MM-DD"}
         },
         "참여자": {
           "people": [{"id": "7c32774b-0096-4545-a9fe-7cfec90faa15"}]
         },
         "구분": {
           "select": {"name": "개발"}
         }
       }
     }'
   ```

   - Database ID: `2fc26170-466f-80e2-999f-cf5ac1963e2f`
   - 페이지 제목: `YYYY년 MM월 DD일` 형식 (예: `2025년 12월 3일`)
   - 작성일시: 오늘 날짜 (YYYY-MM-DD 형식)
   - 참여자: 강주현 (ID: `7c32774b-0096-4545-a9fe-7cfec90faa15`)
   - 구분: "개발" 선택

3. **Git 로그 분석**
   - 어제 날짜의 커밋 내역 조회: `git log --since="어제 00:00" --until="어제 23:59" --oneline`
   - 오늘 날짜의 커밋 내역 조회: `git log --since="오늘 00:00" --oneline`
   - 커밋 메시지에서 작업 내용 추출

4. **페이지 내용 채우기 (curl 사용 필수)**

   > 생성된 페이지 ID를 사용하여 아래 curl 명령어로 블록을 추가하세요.

   ```bash
   curl -X PATCH 'https://api.notion.com/v1/blocks/{PAGE_ID}/children' \
     -H "Authorization: Bearer {NOTION_API_TOKEN}" \
     -H "Content-Type: application/json" \
     -H "Notion-Version: 2022-06-28" \
     -d '{
       "children": [
         {"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "전일 업무 진행상황 보고"}}], "color": "purple_background"}},
         {"type": "divider", "divider": {}},
         {"type": "table", "table": {"table_width": 2, "has_column_header": false, "has_row_header": false, "children": [{"type": "table_row", "table_row": {"cells": [[{"type": "text", "text": {"content": "강주현"}}], [{"type": "text", "text": {"content": "전일 작업 내용"}}]]}}]}},
         {"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "금일 예정 업무 보고"}}], "color": "purple_background"}},
         {"type": "divider", "divider": {}},
         {"type": "table", "table": {"table_width": 2, "has_column_header": false, "has_row_header": false, "children": [{"type": "table_row", "table_row": {"cells": [[{"type": "text", "text": {"content": "강주현"}}], [{"type": "text", "text": {"content": "금일 예정 작업 내용"}}]]}}]}},
         {"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "회의 안건"}}], "color": "purple_background"}},
         {"type": "divider", "divider": {}},
         {"type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": "-"}}]}},
         {"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "추가 논의사항 (ex. 이슈, 휴가 사용 예정 공유)"}}], "color": "purple_background"}},
         {"type": "divider", "divider": {}},
         {"type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": "-"}}]}}
       ]
     }'
   ```

   페이지에 다음 블록들을 추가:

   a. **전일 업무 진행상황 보고** 섹션
      - Heading 2: "전일 업무 진행상황 보고" (purple_background)
      - Divider
      - Table 블록 생성:
        - `table_width: 2`
        - `has_column_header: false`
        - `has_row_header: false`
        - 첫 번째 행: ["강주현", "어제의 git 커밋 내용을 간략하게 요약"]

   b. **금일 예정 업무 보고** 섹션
      - Heading 2: "금일 예정 업무 보고" (purple_background)
      - Divider
      - Table 블록 생성:
        - `table_width: 2`
        - `has_column_header: false`
        - `has_row_header: false`
        - 첫 번째 행: ["강주현", "오늘의 git 커밋 내용 또는 작업 예정 사항"]

   c. **회의 안건** 섹션
      - Heading 2: "회의 안건" (purple_background)
      - Divider
      - Bulleted list item: "-"

   d. **추가 논의사항** 섹션
      - Heading 2: "추가 논의사항 (ex. 이슈, 휴가 사용 예정 공유)" (purple_background)
      - Divider
      - Bulleted list item: "-"

## 참고사항

- 11월 14일 페이지 (ID: `2ab26170-466f-80be-a95a-e51bfba4b584`)의 구조를 참고
- 테이블 헤더는 사용하지 않음 (`has_column_header: false`)
- 커밋 메시지가 없는 경우, 사용자에게 수동으로 입력할 내용을 물어보기

## MCP 도구 제한사항 (중요!)

> **MCP Notion 도구 사용 금지**: `mcp__notion__API-post-page` 도구는 `parent.page_id`만 지원하여 데이터베이스에 페이지를 생성할 수 없습니다.
>
> **해결 방법**: 페이지 생성 및 블록 추가 시 반드시 **curl 명령어**를 사용하세요.
>
> MCP 도구는 다음 용도로만 사용:
> - `API-post-database-query`: 데이터베이스 조회
> - `API-get-block-children`: 블록 조회
> - `API-retrieve-a-page`: 페이지 조회

## Notion API 정보

- DAILY SCRUM Database ID: `2fc26170-466f-80e2-999f-cf5ac1963e2f`
- User ID (강주현): `7c32774b-0096-4545-a9fe-7cfec90faa15`
- API Token: MCP 로그 파일에서 확인 (위 명령어 참고)

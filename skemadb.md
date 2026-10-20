| table_name   | column_name    | data_type                | is_nullable | column_default          |
| ------------ | -------------- | ------------------------ | ----------- | ----------------------- |
| applications | id             | uuid                     | NO          | gen_random_uuid()       |
| applications | job_id         | uuid                     | YES         | null                    |
| applications | pelamar_id     | uuid                     | YES         | null                    |
| applications | score          | integer                  | YES         | 0                       |
| applications | answers        | jsonb                    | YES         | null                    |
| applications | submitted_at   | timestamp with time zone | YES         | now()                   |
| applications | status         | text                     | YES         | 'Menunggu Review'::text |
| jobs         | id             | uuid                     | NO          | gen_random_uuid()       |
| jobs         | perekrut_id    | uuid                     | NO          | null                    |
| jobs         | title          | text                     | NO          | null                    |
| jobs         | category       | text                     | NO          | null                    |
| jobs         | description    | text                     | YES         | null                    |
| jobs         | is_active      | boolean                  | YES         | true                    |
| jobs         | created_at     | timestamp with time zone | YES         | now()                   |
| profiles     | id             | uuid                     | NO          | null                    |
| profiles     | role           | text                     | NO          | null                    |
| profiles     | full_name      | text                     | YES         | null                    |
| profiles     | company_name   | text                     | YES         | null                    |
| profiles     | created_at     | timestamp with time zone | YES         | now()                   |
| profiles     | logo_url       | text                     | YES         | null                    |
| profiles     | phone          | text                     | YES         | null                    |
| profiles     | domisili       | text                     | YES         | null                    |
| profiles     | pendidikan     | text                     | YES         | null                    |
| profiles     | ringkasan      | text                     | YES         | null                    |
| questions    | id             | uuid                     | NO          | gen_random_uuid()       |
| questions    | job_id         | uuid                     | YES         | null                    |
| questions    | question_text  | text                     | NO          | null                    |
| questions    | option_a       | text                     | YES         | null                    |
| questions    | option_b       | text                     | YES         | null                    |
| questions    | option_c       | text                     | YES         | null                    |
| questions    | option_d       | text                     | YES         | null                    |
| questions    | correct_answer | text                     | YES         | null                    |
| questions    | order_num      | integer                  | YES         | null                    |
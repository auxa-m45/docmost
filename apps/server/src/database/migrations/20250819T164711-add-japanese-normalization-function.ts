import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create Japanese text normalization function
  // This function performs NFKC normalization and katakana to hiragana conversion
  // for improved Japanese text search capabilities
  await sql`
    CREATE OR REPLACE FUNCTION f_normalize_japanese(input_text text) RETURNS text
    AS $$
    DECLARE   
        result text;  
        katakana_chars text := 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンァィゥェォャュョッヴガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ';
        hiragana_chars text := 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんぁぃぅぇぉゃゅょっゔがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ';
    BEGIN 
        IF input_text IS NULL THEN
            RETURN NULL;  
        END IF;   

        -- NFKC正規化 
        result := normalize(input_text, NFKC);

        -- カタカナ→ひらがな変換  
        result := translate(result, katakana_chars, hiragana_chars);  

        RETURN result;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE STRICT;
  `.execute(db);

  // Update the pages tsvector trigger to use the new Japanese normalization function
  await sql`
    CREATE OR REPLACE FUNCTION pages_tsvector_trigger() RETURNS trigger AS $$
    begin
        new.tsv :=
                  setweight(to_tsvector('english', f_normalize_japanese(coalesce(new.title, ''))), 'A') ||
                  setweight(to_tsvector('english', f_normalize_japanese(substring(coalesce(new.text_content, ''), 1, 1000000))), 'B');
        return new;
    end;
    $$ LANGUAGE plpgsql;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Revert to the previous tsvector trigger using f_unaccent
  await sql`
    CREATE OR REPLACE FUNCTION pages_tsvector_trigger() RETURNS trigger AS $$
    begin
        new.tsv :=
                  setweight(to_tsvector('english', f_unaccent(coalesce(new.title, ''))), 'A') ||
                  setweight(to_tsvector('english', f_unaccent(substring(coalesce(new.text_content, ''), 1, 1000000))), 'B');
        return new;
    end;
    $$ LANGUAGE plpgsql;
  `.execute(db);

  // Drop the Japanese normalization function
  await sql`DROP FUNCTION IF EXISTS f_normalize_japanese(text)`.execute(db);
}

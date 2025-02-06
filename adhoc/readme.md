# AAR版docmost

このリポジトリは、docmost/docmostをフォークしてDiscord認証や独自のブロックなどのカスタマイズを行ったものです。

## 環境構築
主な環境構築手順は、docmostのドキュメントを参照してください。

### 環境変数の設定
docmostの標準の環境変数の他に、以下の環境変数を設定する必要があります。

```javascript
const key = crypto.randomBytes(32).toString('hex');
const iv = crypto.randomBytes(16).toString('hex');
console.log('STATE_ENCRYPTION_KEY:', key);
console.log('STATE_ENCRYPTION_IV:', iv);
```

## 追加されたブロック

### TODO: オーディオブロック
音声ファイルを再生するブロックです。

### TODO: niconicoブロック
ニコニコ動画を埋め込むブロックです。

### TODO: soundcloudブロック
SoundCloudのトラックを埋め込むブロックです。


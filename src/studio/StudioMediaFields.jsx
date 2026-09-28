import { useTrainingMediaUrl } from '../training/trainingMedia.js'
import { supabase } from '../utils/supabase.js'

function MediaField({ contentId, mediaId, kind, title, description, disabled, onChange }) {
  const url = useTrainingMediaUrl(supabase, mediaId, contentId)
  const image = kind === 'game_cover'
  return <div className="studio-media-field">
    <div><strong>{title}</strong><p>{description}</p></div>
    {url && (image
      ? <img src={url} alt="Current game cover" loading="lazy" />
      : <audio controls preload="none" src={url} aria-label="Current lobby audio" />)}
    {mediaId && !url && <p role="status">Loading the private preview…</p>}
    <div className="studio-media-actions">
      <label className="studio-media-upload">{mediaId ? 'Change' : 'Upload'} {image ? 'cover' : 'audio'}
        <input type="file" accept={image ? 'image/jpeg,image/png,image/webp' : 'audio/mpeg,audio/mp4'}
          disabled={disabled} onChange={event => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void onChange(kind, file)
          }} />
      </label>
      {mediaId && <button type="button" disabled={disabled} onClick={() => void onChange(kind, null)}>Remove</button>}
    </div>
  </div>
}

export function StudioMediaFields({ contentId, media, disabled, onChange }) {
  if (!contentId) return <p>Save this draft before adding a cover or lobby audio.</p>
  return <div className="studio-media-fields">
    <MediaField contentId={contentId} mediaId={media?.cover_media_id} kind="game_cover"
      title="Game cover" description="JPEG, PNG or WebP · up to 2 MB" disabled={disabled} onChange={onChange} />
    <MediaField contentId={contentId} mediaId={media?.lobby_audio_media_id} kind="lobby_audio"
      title="Lobby audio" description="MP3 or M4A · up to 4 MB" disabled={disabled} onChange={onChange} />
  </div>
}

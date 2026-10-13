// Fixed local assets supplied by the user. Never accept arbitrary audio URLs.
export const SOUND_FILES=Object.freeze({
 iphone_radar:new URL('./sounds/iphone-radar.mp3',import.meta.url).href,
 reveille:new URL('./sounds/reveille.mp3',import.meta.url).href,
 alarm_effect:new URL('./sounds/alarm-effect.mp3',import.meta.url).href,
})

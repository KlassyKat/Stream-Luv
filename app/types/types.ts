export interface ControlBtn {
    svg: string,
    svg_toggle?: string,
    toggle_trigger?: boolean,
    control: () => void,
}

export interface Stream {
    id: string,
    name: string,
    img: string,
    autoopen: boolean,
    live: boolean,
    streamopen: boolean,
    autocollect: boolean
}

export interface SearchResult {
    broadcaster_language: string,
    broadcaster_login: string,
    display_name: string,
    game_id: Number,
    id: Number,
    is_live: boolean,
    tag_ids: [],
    thumbnail_url: string,
    title: string,
    started_at: string
}

export enum OpenType {
    browser = "browser",
    streamluv = "streamluv",
    auto = "auto",
    manual = "manual"
}

export interface Settings {
    login: string,
    startmuted: boolean,
    linktype: OpenType,
    autoopentype: OpenType,
    pause: false,
    muteshortcut: string[],
    bttv: boolean,
    autoclose: boolean,
    cycleshortcut: string[],
    openonstartup: boolean,
    livestreamsection: boolean
}
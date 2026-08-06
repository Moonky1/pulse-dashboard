import { supabase } from '../utils/supabase'
import {
  getStudioOwnerKey,
  mapStudioGame,
} from './studioGamesApi'

function normalizeTeam(value) {
  return String(value || 'global')
    .trim()
    .toLowerCase() || 'global'
}

function normalizeOverview(data) {
  const overview =
    data && typeof data === 'object'
      ? data
      : {}

  return {
    myGames: Number(
      overview.my_games || 0
    ),

    published: Number(
      overview.published || 0
    ),

    drafts: Number(
      overview.drafts || 0
    ),

    archived: Number(
      overview.archived || 0
    ),

    totalPlays: Number(
      overview.total_plays || 0
    ),

    averageScore:
      overview.average_score === null ||
      overview.average_score === undefined
        ? null
        : Number(
            overview.average_score
          ),

    starsReceived: Number(
      overview.stars_received || 0
    ),

    recentDrafts:
      Array.isArray(
        overview.recent_drafts
      )
        ? overview.recent_drafts.map(
            mapStudioGame
          )
        : [],

    latestGames:
      Array.isArray(
        overview.latest_games
      )
        ? overview.latest_games.map(
            (row) => ({
              ...mapStudioGame(row),

              starCount: Number(
                row.star_count || 0
              ),
            })
          )
        : [],
  }
}

function mapLibraryGame(row) {
  return {
    ...mapStudioGame(row),

    questionCount: Number(
      row.question_count || 0
    ),

    starCount: Number(
      row.star_count || 0
    ),

    viewerStarred: Boolean(
      row.viewer_starred
    ),

    canStar: Boolean(
      row.can_star
    ),
  }
}

export async function getStudioOverview({
  user,
  role,
}) {
  const ownerKey =
    getStudioOwnerKey(
      user,
      role
    )

  if (!ownerKey) {
    throw new Error(
      'Could not identify the Studio creator.'
    )
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    'get_pulse_studio_overview',
    {
      p_owner_key:
        ownerKey,
    }
  )

  if (error) {
    console.error(
      'Could not load Studio overview:',
      error
    )

    throw new Error(
      error.message ||
        'Could not load the Studio overview.'
    )
  }

  return normalizeOverview(data)
}

export async function getStudioLibrary({
  user,
  role,
}) {
  const viewerKey =
    getStudioOwnerKey(
      user,
      role
    )

  const viewerTeam =
    normalizeTeam(
      user?.team
    )

  const {
    data,
    error,
  } = await supabase.rpc(
    'get_pulse_studio_library',
    {
      p_viewer_key:
        viewerKey,

      p_viewer_team:
        viewerTeam,
    }
  )

  if (error) {
    console.error(
      'Could not load Studio library:',
      error
    )

    throw new Error(
      error.message ||
        'Could not load the Studio game library.'
    )
  }

  return Array.isArray(data)
    ? data.map(
        mapLibraryGame
      )
    : []
}

export async function toggleStudioGameStar({
  gameId,
  user,
  role,
}) {
  const voterKey =
    getStudioOwnerKey(
      user,
      role
    )

  if (!gameId) {
    throw new Error(
      'A valid Studio game is required.'
    )
  }

  if (!voterKey) {
    throw new Error(
      'Could not identify the voter.'
    )
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    'toggle_pulse_studio_game_star',
    {
      p_game_id:
        gameId,

      p_voter_key:
        voterKey,

      p_voter_name:
        user?.name ||
        'Pulse User',

      p_voter_team:
        normalizeTeam(
          user?.team
        ),
    }
  )

  if (error) {
    console.error(
      'Could not update Studio star:',
      error
    )

    throw new Error(
      error.message ||
        'Could not update this game star.'
    )
  }

  return {
    gameId:
      data?.game_id || gameId,

    starred:
      Boolean(
        data?.starred
      ),

    starCount: Number(
      data?.star_count || 0
    ),
  }
}

export function GoProgressOverview({ progress }) {
  return <><div className="go-player-progress__stats">
    <div><strong>{progress.hosted_games}</strong><span>Hosted games</span></div>
    <div><strong>{progress.practice_games}</strong><span>Practice games</span></div>
    <div><strong>{progress.average_accuracy == null ? '—' : `${Math.round(Number(progress.average_accuracy))}%`}</strong><span>Average accuracy</span></div>
    <div><strong>{Number(progress.competitive?.points || 0).toLocaleString()}</strong><span>Hosted points</span></div>
    <div><strong>{progress.competitive?.rank ? `#${progress.competitive.rank}` : '—'}</strong><span>Global rank</span></div>
  </div><section className="go-player-progress__recent"><h2>Recent GO activity</h2>
    {progress.recent_activity?.length ? <ol>{progress.recent_activity.map(game => <li key={game.attempt_id}>
      <span><strong>{game.game}</strong><small>{game.mode === 'go_hosted' ? 'Hosted' : 'Practice'} · {new Date(game.completed_at).toLocaleDateString()}</small></span>
      <b>{Math.round(Number(game.score_percent))}%</b>
    </li>)}</ol> : <p>Completed GO games will show here.</p>}
  </section></>
}

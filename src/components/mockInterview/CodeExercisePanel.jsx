import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { mockInterviewAPI } from '../../api';
import './CodeExercisePanel.css';

// Shown when the interviewer asks a DSA or SQL question (interviewAgent.js
// broadcasts a "coding_question" data message when it reaches one of these).
// The candidate writes real code/SQL, runs it, and either submits a passing
// solution or asks to move on — either way a "code_result" data message goes
// back to the agent, which advances the interview exactly like a spoken
// answer would (see InterviewController.onCodingResult).

const LANG_LABELS = { javascript: 'JavaScript', python: 'Python', cpp: 'C++', java: 'Java' };

// Difficulty is stored as 1-5 internally (for picking a problem close to the
// candidate's seniority); shown to the candidate the way LeetCode does.
function difficultyLabel(d) {
  if (d <= 2) return { text: 'Easy', cls: 'easy' };
  if (d === 3) return { text: 'Medium', cls: 'medium' };
  return { text: 'Hard', cls: 'hard' };
}

function decode(payload) {
  try { return JSON.parse(new TextDecoder().decode(payload)); } catch { return null; }
}

function send(room, obj) {
  room?.localParticipant?.publishData(new TextEncoder().encode(JSON.stringify(obj)), { reliable: true });
}

export default function CodeExercisePanel({ interviewId }) {
  const room = useRoomContext();
  const [active, setActive] = useState(null); // { kind, problemId, qid } | null
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!room) return;
    const onData = (payload) => {
      const msg = decode(payload);
      if (!msg) return;
      if (msg.type === 'coding_question') { setActive(msg); setDone(false); }
      else if (msg.type === 'hide_coding_panel') { setActive(null); setDone(false); }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => room.off(RoomEvent.DataReceived, onData);
  }, [room]);

  if (!active || done) return null;

  const report = (passed, total, skipped) => {
    send(room, { type: 'code_result', qid: active.qid, passed, total, skipped });
    setDone(true);
  };

  const wide = active.kind === 'coding';
  return (
    <div className="cep-overlay">
      <div className={`cep-panel${wide ? ' cep-panel-wide' : ''}`}>
        {wide
          ? <CodingExercise interviewId={interviewId} problemId={active.problemId} onDone={report} />
          : <SqlExercise interviewId={interviewId} problemId={active.problemId} onDone={report} />}
      </div>
    </div>
  );
}

function MoveOnButton({ onDone, disabled }) {
  return (
    <button className="cep-btn cep-btn-ghost" disabled={disabled} onClick={() => onDone(0, 0, true)}>
      I'm stuck, move on
    </button>
  );
}

function CodingExercise({ interviewId, problemId, onDone }) {
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [error, setError] = useState('');
  const touchedCode = useRef(false);

  useEffect(() => {
    let cancelled = false;
    mockInterviewAPI.getCodeProblem(interviewId, problemId).then(({ problem: p }) => {
      if (cancelled) return;
      setProblem(p);
      if (!touchedCode.current) setCode(p.starter[language] || '');
    }).catch(err => setError(err.message || 'Could not load the problem'));
    return () => { cancelled = true; };
  }, [interviewId, problemId]);

  const onLanguageChange = (lang) => {
    setLanguage(lang);
    if (!touchedCode.current && problem) setCode(problem.starter[lang] || '');
  };

  const run = async () => {
    setBusy(true); setError(''); setRunResults(null);
    try {
      const res = await mockInterviewAPI.runCode(interviewId, problemId, { language, source: code });
      setRunResults(res.results);
    } catch (err) {
      setError(err.message || 'Could not run your code');
    } finally { setBusy(false); }
  };

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const res = await mockInterviewAPI.submitCode(interviewId, problemId, { language, source: code });
      if (res.allPassed) { onDone(res.passed, res.total, false); return; }
      setRunResults(res.results);
      setError(`${res.passed}/${res.total} test cases passed. Fix it and submit again, or move on.`);
    } catch (err) {
      setError(err.message || 'Could not grade your code');
    } finally { setBusy(false); }
  };

  if (!problem) return <div className="cep-loading">{error || 'Loading the problem…'}</div>;
  const diff = difficultyLabel(problem.difficulty);

  return (
    <div className="cep-split">
      <div className="cep-desc">
        <div className="cep-desc-title">{problem.title}</div>
        <span className={`cep-diff-badge cep-diff-${diff.cls}`}>{diff.text}</span>
        {problem.examples?.map((ex, i) => (
          <div key={i} className="cep-example">
            <div className="cep-example-label">Example {i + 1}:</div>
            <pre className="cep-example-body">
              <b>Input:</b> {ex.input}{'\n'}<b>Output:</b> {ex.output}
              {ex.explanation ? `\n${'Explanation: '}${ex.explanation}` : ''}
            </pre>
          </div>
        ))}
        {!!problem.constraints?.length && (
          <div className="cep-constraints">
            <div className="cep-example-label">Constraints:</div>
            <ul>{problem.constraints.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
        )}
        {problem.ioNote && (
          <div className="cep-ionote"><b>Input / Output for this exercise:</b> {problem.ioNote}</div>
        )}
      </div>

      <div className="cep-code-pane">
        <div className="cep-header">
          <span className="cep-title">Code</span>
          <select className="cep-lang" value={language} onChange={e => onLanguageChange(e.target.value)}>
            {problem.languages.map(l => <option key={l} value={l}>{LANG_LABELS[l] || l}</option>)}
          </select>
        </div>
        <textarea
          className="cep-editor" spellCheck={false} value={code}
          onChange={e => { touchedCode.current = true; setCode(e.target.value); }}
        />
        {runResults && (
          <div className="cep-results">
            {runResults.map((r, i) => (
              <div key={i} className={`cep-case ${r.passed ? 'pass' : 'fail'}`}>
                {r.hidden ? (r.passed ? 'Hidden case: passed' : 'Hidden case: failed')
                  : (<>
                    <div>{r.passed ? '✓ Sample case passed' : '✗ Sample case failed'}</div>
                    {!r.passed && <pre className="cep-diff">got: {r.stdout || r.stderr || '(no output)'}</pre>}
                  </>)}
              </div>
            ))}
          </div>
        )}
        {error && <div className="cep-error">{error}</div>}
        <div className="cep-actions">
          <MoveOnButton onDone={onDone} disabled={busy} />
          <button className="cep-btn" disabled={busy} onClick={run}>Run sample tests</button>
          <button className="cep-btn cep-btn-primary" disabled={busy} onClick={submit}>Submit</button>
        </div>
      </div>
    </div>
  );
}

function SqlExercise({ interviewId, problemId, onDone }) {
  const [problem, setProblem] = useState(null);
  const [db, setDb] = useState(null);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(null);
  const [columns, setColumns] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    mockInterviewAPI.getSqlProblem(interviewId, problemId).then(async ({ problem: p }) => {
      if (cancelled) return;
      setProblem(p);
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs({ locateFile: f => `https://sql.js.org/dist/${f}` });
      if (cancelled) return;
      const instance = new SQL.Database();
      instance.run(p.schema);
      setDb(instance);
    }).catch(err => setError(err.message || 'Could not load the problem'));
    return () => { cancelled = true; };
  }, [interviewId, problemId]);

  const run = () => {
    setError('');
    if (!db) return;
    try {
      const res = db.exec(query);
      if (!res.length) { setColumns([]); setRows([]); return; }
      setColumns(res[0].columns);
      setRows(res[0].values);
    } catch (err) {
      setColumns(null); setRows(null);
      setError(err.message);
    }
  };

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const res = await mockInterviewAPI.submitSql(interviewId, problemId, { query });
      if (res.ok) { onDone(1, 1, false); return; }
      setError(res.error || `That returns ${res.rowCount ?? '?'} row(s), expected ${res.expectedRowCount ?? '?'}. Try again, or move on.`);
    } catch (err) {
      setError(err.message || 'Could not grade your query');
    } finally { setBusy(false); }
  };

  if (!problem) return <div className="cep-loading">{error || 'Loading the problem…'}</div>;

  return (
    <>
      <div className="cep-header"><span className="cep-title">{problem.title}</span></div>
      <p className="cep-prompt">{problem.prompt}</p>
      <pre className="cep-schema">{problem.schema.trim()}</pre>
      <textarea
        className="cep-editor cep-editor-sql" spellCheck={false} value={query}
        placeholder="SELECT …" onChange={e => setQuery(e.target.value)}
      />
      {rows && (
        <div className="cep-table-wrap">
          <table className="cep-table">
            <thead><tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{String(v)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      {error && <div className="cep-error">{error}</div>}
      <div className="cep-actions">
        <MoveOnButton onDone={onDone} disabled={busy} />
        <button className="cep-btn" disabled={busy || !db} onClick={run}>Run</button>
        <button className="cep-btn cep-btn-primary" disabled={busy} onClick={submit}>Submit</button>
      </div>
    </>
  );
}

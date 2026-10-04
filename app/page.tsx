'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, CSSProperties, FormEvent } from 'react';
import { Bell, Check, ChevronRight, Eye, Flame, Handshake, HeartPulse, Menu, Plus, Sparkles, Swords, Target, Trophy, Upload, X, Zap } from 'lucide-react';

type Fighter = { name: string; style: string; gender: 'M' | 'F'; sales: number; vgv: number; team: string; wins: string[]; photo?: string; faceCrop?: { x: number; y: number; zoom: number } };
type View = 'arena' | 'fighter';

const initial: Fighter[] = [
  { name: 'Lucas Costa', style: 'Muay Thai', gender: 'M', sales: 7, vgv: 1730000, team: 'BLACK HOUSE', wins: ['Knockout · 1º round', 'Finalização · Submission', 'Vitória por pontos', 'Knockout · 1º round'] },
  { name: 'Pedro Augusto', style: 'Jiu-Jitsu', gender: 'M', sales: 6, vgv: 1490000, team: 'IRON GROUND', wins: ['Finalização · Submission', 'Vitória por pontos'] },
  { name: 'Yuri', style: 'Kickboxing', gender: 'M', sales: 5, vgv: 1270000, team: 'WOLFPACK', wins: ['Knockout · 1º round', 'Vitória por pontos'] },
  { name: 'Hércules', style: 'Wrestling', gender: 'M', sales: 3, vgv: 980000, team: 'IRON GROUND', wins: ['Finalização · Submission'] },
  { name: 'Malu Ribeiro', style: 'Taekwondo', gender: 'F', sales: 2, vgv: 720000, team: 'BLACK HOUSE', wins: ['Knockout · 1º round'] },
  { name: 'Lucas Silva', style: 'Karatê', gender: 'M', sales: 1, vgv: 490000, team: 'WOLFPACK', wins: ['Vitória por pontos'] },
];

const events = [
  { name: 'EVENTO 01', sub: 'QUALIFICATÓRIA', goal: 2500000, belt: 'CINTURÃO QUALIFIER', prize: 'PRIMEIRA VENDA · R$ 500', badge: '/assets/event-qualifier.webp' },
  { name: 'EVENTO 02', sub: 'MAIN EVENT', goal: 3500000, belt: 'CINTURÃO MAIN EVENT', prize: 'PREMIAÇÃO META 2', badge: '/assets/event-main.webp' },
  { name: 'EVENTO 03', sub: 'UNIFICAÇÃO', goal: 5000000, belt: 'CINTURÃO UNIFICADO', prize: 'GRANDE FINAL', badge: '/assets/event-unified.webp' },
];

const skillOptions = [
  { name: 'FINALIZAÇÃO', type: 'COMBATE', detail: 'Fecha a oportunidade com precisão.', stat: 'PRECISÃO', level: 92, icon: Target, accent: '#d2aa61' },
  { name: 'KNOCKOUT', type: 'COMBATE', detail: 'Impacto alto na hora decisiva.', stat: 'IMPACTO', level: 96, icon: Flame, accent: '#d17a4f' },
  { name: 'RESILIÊNCIA', type: 'MENTALIDADE', detail: 'Mantém o ritmo sob pressão.', stat: 'DEFESA', level: 88, icon: HeartPulse, accent: '#91aa9a' },
  { name: 'VISÃO DE JOGO', type: 'ESTRATÉGIA', detail: 'Lê o cenário antes do próximo round.', stat: 'LEITURA', level: 91, icon: Eye, accent: '#8baabd' },
  { name: 'NEGOCIAÇÃO', type: 'PERFORMANCE', detail: 'Transforma conversa em resultado.', stat: 'CONVERSÃO', level: 94, icon: Handshake, accent: '#c69c72' },
  { name: 'VELOCIDADE', type: 'PERFORMANCE', detail: 'Responde rápido e ganha terreno.', stat: 'RITMO', level: 86, icon: Zap, accent: '#bdad6d' },
];
const styles = ['Muay Thai', 'Jiu-Jitsu', 'Kickboxing', 'Wrestling', 'Karatê', 'Taekwondo'];
const money = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
const category = (n: number) => n >= 5 ? 'PESO PESADO' : n >= 3 ? 'MEIO-PESADO' : n >= 1 ? 'PESO LEVE' : 'ESTREANTE';
const styleAsset: Record<string, string> = { 'Muay Thai': 'muay-thai', 'Jiu-Jitsu': 'jiu-jitsu', Kickboxing: 'kickboxing', Wrestling: 'wrestling', 'Karatê': 'karate', Taekwondo: 'taekwondo' };
const fighterAsset = (style: string, gender: 'M' | 'F') => `/assets/fighter-${gender === 'F' ? 'female' : 'male'}-${styleAsset[style] ?? 'muay-thai'}.webp`;
function FighterFigure({ style, gender, face, crop, className = '' }: { style: string; gender: 'M' | 'F'; face?: string; crop?: { x: number; y: number; zoom: number }; className?: string }) {
  const frame = crop ?? { x: 50, y: 38, zoom: 1.35 };
  return <div className={`fighter-figure-stage ${className}`}>
    <img className="fighter-figure" src={fighterAsset(style, gender)} alt="" />
    {face && <div className="fighter-face-window"><img src={face} alt="Rosto do executivo" style={{ objectPosition: `${frame.x}% ${frame.y}%`, transform: `scale(${frame.zoom})` }} /></div>}
  </div>;
}
const divisionAsset = (sales: number) => `/assets/division-${sales >= 5 ? 'heavy' : sales >= 3 ? 'middle' : 'light'}.webp`;
const resultBadge = (win: string) => win.toLowerCase().includes('knockout') ? '/assets/badge-knockout.webp' : win.toLowerCase().includes('finalização') ? '/assets/badge-submission.webp' : '/assets/badge-points-win.webp';

export default function Home() {
  const [fighters, setFighters] = useState(initial);
  const [view, setView] = useState<View>('arena');
  const [modal, setModal] = useState(false);
  const [notice, setNotice] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profile, setProfile] = useState({ name: 'SEU NOME', nickname: 'THE CONTENDER', style: 'Muay Thai', division: 'MASCULINO', team: 'EQUIPE MENFE', skills: ['KNOCKOUT', 'NEGOCIAÇÃO'], photo: '', faceCrop: { x: 50, y: 38, zoom: 1.35 } });
  const [form, setForm] = useState({ fighter: initial[0].name, value: '', result: 'Knockout · 1º round', note: '' });
  const ranked = useMemo(() => [...fighters].sort((a, b) => b.vgv - a.vgv), [fighters]);
  const total = ranked.reduce((sum, fighter) => sum + fighter.vgv, 0);
  const leads = ranked.slice(0, 2);
  const winner = ranked[0];
  const selectedGender = profile.division === 'FEMININO' ? 'F' : 'M';

  useEffect(() => {
    const savedProfile = window.localStorage.getItem('umc-fighter-card');
    if (!savedProfile) return;
    try {
      const saved = JSON.parse(savedProfile);
      setProfile(current => ({ ...current, ...saved, skills: saved.skills ?? current.skills, faceCrop: saved.faceCrop ?? current.faceCrop }));
      setProfileSaved(true);
    } catch {
      window.localStorage.removeItem('umc-fighter-card');
    }
  }, []);

  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3500); };
  const toggleSkill = (skill: string) => setProfile(current => ({ ...current, skills: current.skills.includes(skill) ? current.skills.filter(item => item !== skill) : current.skills.length < 3 ? [...current.skills, skill] : current.skills }));
  const uploadPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { notify('ESCOLHA UMA FOTO EM FORMATO DE IMAGEM'); return; }
    if (file.size > 8 * 1024 * 1024) { notify('A FOTO PRECISA TER ATÉ 8 MB'); event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const source = new Image();
      source.onload = () => {
        const scale = Math.min(1, 720 / source.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(source.width * scale);
        canvas.height = Math.round(source.height * scale);
        const context = canvas.getContext('2d');
        context?.drawImage(source, 0, 0, canvas.width, canvas.height);
        setProfile(current => ({ ...current, photo: canvas.toDataURL('image/jpeg', 0.78), faceCrop: current.faceCrop ?? { x: 50, y: 38, zoom: 1.35 } }));
      };
      source.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };
  const saveProfile = () => {
    try {
      window.localStorage.setItem('umc-fighter-card', JSON.stringify(profile));
      setProfileSaved(true);
      notify('FIGHTER CARD E ENQUADRAMENTO SALVOS NESTE NAVEGADOR');
    } catch {
      notify('NÃO FOI POSSÍVEL SALVAR. TENTE UMA FOTO MENOR.');
    }
  };
  const award = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(form.value);
    if (!amount) return;
    setFighters(current => current.map(fighter => fighter.name === form.fighter ? { ...fighter, vgv: fighter.vgv + amount, sales: fighter.sales + 1, wins: [form.result, ...fighter.wins] } : fighter));
    notify(`VITÓRIA REGISTRADA · ${form.fighter.toUpperCase()}`);
    setModal(false);
  };

  return <main>
    <header className="topbar">
      <button className="menu-button" aria-label="Abrir menu"><Menu size={19} /></button>
      <a href="#top" className="brand"><img src="/assets/umc-emblem.webp" alt="UMC — Ultimate Menfe Championship" /></a>
      <nav aria-label="Navegação principal">
        <button className={view === 'arena' ? 'nav-link active' : 'nav-link'} onClick={() => setView('arena')}>ARENA</button>
        <a className="nav-link" href="#eventos">EVENTOS</a>
        <a className="nav-link" href="#fighters">RANKING</a>
        <button className={view === 'fighter' ? 'nav-link active' : 'nav-link'} onClick={() => setView('fighter')}>MEU FIGHTER</button>
      </nav>
      <div className="header-actions"><button className="notification" aria-label="Notificações" onClick={() => notify('VOCÊ ESTÁ NO CARD OFICIAL DA UMC')}><Bell size={17} /></button><button className="user-pill" onClick={() => setView('fighter')}><span className="user-avatar">LJ</span><span>EXECUTIVO</span><ChevronRight size={14} /></button></div>
    </header>

    {view === 'arena' ? <>
      <div className="status-strip"><span><i className="status-dot" /> TEMPORADA AO VIVO</span><span>OUTUBRO 2026</span><span className="status-end">OCTAGON SERIES <b>01—03</b></span></div>
      <section className="hero" id="top">
        <div className="hero-image" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-line" /> A TEMPORADA COMEÇA AQUI</div>
          <h1>ENTRE<br />NO <em>OCTAGON.</em></h1>
          <p>Cada venda conta uma história.<br />Cada round aproxima você do cinturão.</p>
          <div className="hero-buttons"><a className="button-gold" href="#eventos">ACOMPANHAR A TEMPORADA <ChevronRight size={16} /></a><button className="button-quiet" onClick={() => setView('fighter')}>MONTAR MEU FIGHTER <Swords size={16} /></button></div>
        </div>
        <div className="hero-lockup"><img src="/assets/umc-emblem.webp" alt="UMC — Ultimate Menfe Championship" /></div>
        <div className="hero-bottom"><span>UMC / 2026</span><span>THE FIGHT FOR GREATNESS</span><span>01 <i /> 03</span></div>
      </section>
      <section className="quick-stats">
        <div><span>NO CARD</span><strong>{String(fighters.length).padStart(2, '0')}</strong><small>EXECUTIVOS</small></div>
        <div><span>VGV DA TEMPORADA</span><strong>{money(total)}</strong><small>ACUMULADO</small></div>
        <div><span>EM DISPUTA</span><strong>03</strong><small>CINTURÕES</small></div>
        <div className="stat-cta"><span>SEU PRÓXIMO ROUND COMEÇA AGORA</span><img src="/assets/badge-first-blood.webp" alt="First Blood — primeira venda do mês: R$ 500" /><button onClick={() => setView('fighter')}>CRIAR MEU PERFIL <ChevronRight size={15} /></button></div>
      </section>
      <section className="events-section" id="eventos">
        <div className="section-title-row"><div><div className="eyebrow">ROAD TO THE BELT <span className="eyebrow-line" /></div><h2>UMA TEMPORADA.<br /><em>TRÊS CONQUISTAS.</em></h2></div><div className="progress-total"><span>PROGRESSO GERAL</span><strong>{Math.min(Math.round(total / 5000000 * 100), 100)}<small>%</small></strong></div></div>
        <div className="season-progress"><div className="season-progress-fill" style={{ width: `${Math.min(total / 5000000 * 100, 100)}%` }} />{events.map((event, index) => <div key={event.name} className={total >= event.goal ? 'progress-marker won' : 'progress-marker'} style={{ left: `${event.goal / 5000000 * 100}%` }}><span>{String(index + 1).padStart(2, '0')}</span><small>{money(event.goal)}</small></div>)}</div>
        <div className="event-grid">{events.map((event, index) => <article className={total >= event.goal ? 'event-card completed' : 'event-card'} key={event.name}>
          <div className="event-card-head"><span>CHAPTER 0{index + 1}</span><span>{total >= event.goal ? 'CONCLUÍDO' : 'EM DISPUTA'}</span></div>
          <div className="event-emblem"><img src={event.badge} alt={`${event.name} UMC`} /></div>
          <h3>{event.sub}</h3><p>{event.belt}</p><div className="event-target"><span>ALVO DA ETAPA</span><strong>{money(event.goal)}</strong></div>
          <div className="event-footer">{total >= event.goal ? <>VENCEDOR DA ETAPA <b>{winner.name.toUpperCase()}</b></> : event.prize}</div>
        </article>)}</div>
        <p className="event-caption"><Sparkles size={14} /> O maior VGV individual no momento em que a meta é alcançada leva o cinturão da etapa. Primeira venda do mês: <b>R$ 500.</b></p>
      </section>
      <section className="main-event" id="main-event"><div className="main-event-head"><div className="eyebrow"><span className="status-dot" /> MAIN EVENT</div><span>DISPUTA PELO TOPO <b>· TOP 2 VGV</b></span></div>
        <div className="main-event-cards">{leads.map((fighter, index) => <article key={fighter.name} className={index ? 'headliner challenger' : 'headliner'}>
          <div className="headliner-photo"><FighterFigure style={fighter.style} gender={fighter.gender} face={fighter.photo} crop={fighter.faceCrop} /><span className="fighter-corner">{index ? 'BLUE CORNER' : 'RED CORNER'}</span><span className="fighter-seed">0{index + 1}</span></div>
          <div className="headliner-info"><span>{index ? 'CONTENDER' : 'CURRENT LEADER'}</span><h3>{fighter.name}</h3><small>{fighter.team} <i /> {fighter.style.toUpperCase()}</small><div className="headliner-vgv"><span>VGV ACUMULADO</span><b>{money(fighter.vgv)}</b></div></div>
        </article>)}<div className="versus-mark">VS</div></div>
        <div className="faceoff"><span>VANTAGEM ATUAL</span><b>{money(Math.abs(leads[0].vgv - leads[1].vgv))}</b><span>A PRÓXIMA VENDA MUDA O RANKING</span></div>
      </section>
      <section className="roster-section" id="fighters"><div className="section-title-row"><div><div className="eyebrow">O CARD OFICIAL <span className="eyebrow-line" /></div><h2>RANKING <em>DA ARENA.</em></h2></div><button className="button-quiet" onClick={() => setView('fighter')}>MEU FIGHTER <ChevronRight size={15} /></button></div>
        <div className="roster-grid">{ranked.map((fighter, index) => <article className="roster-card" key={fighter.name}><div className="roster-photo"><FighterFigure style={fighter.style} gender={fighter.gender} face={fighter.photo} crop={fighter.faceCrop} /><span className="roster-rank">#{String(index + 1).padStart(2, '0')}</span><img className="roster-weight-badge" src={divisionAsset(fighter.sales)} alt={category(fighter.sales)} /><b>{fighter.team}</b></div><div className="roster-body"><div className="roster-name"><div><h3>{fighter.name}</h3><span>{fighter.style} · {fighter.gender === 'F' ? 'F' : 'M'}</span></div><Trophy size={17} /></div><div className="roster-vgv"><span>VGV ACUMULADO</span><b>{money(fighter.vgv)}</b></div><div className="roster-record"><span>CARTEL</span><b>{String(fighter.sales).padStart(2, '0')}—00</b><button onClick={() => { setForm(current => ({ ...current, fighter: fighter.name })); setModal(true); }}>+ REGISTRAR VENDA</button></div></div></article>)}</div>
      </section>
      <section className="wins-section"><div className="section-title-row"><div><div className="eyebrow">DING DING · HISTÓRICO <span className="eyebrow-line" /></div><h2>ÚLTIMAS <em>VITÓRIAS.</em></h2></div><button className="button-gold" onClick={() => setModal(true)}>REGISTRAR RESULTADO <Plus size={15} /></button></div>
        <div className="win-list">{ranked.flatMap(fighter => fighter.wins.map((win, index) => ({ fighter, win, index }))).slice(0, 7).map(({ fighter, win }, index) => <div className="win-row" key={`${fighter.name}-${index}`}><img className="win-badge" src={resultBadge(win)} alt="" /><b>{fighter.name}</b><span className="win-type">{win}</span><span className="win-meta">{index === 0 ? 'HOJE' : `0${index + 1} OUT`}</span><ChevronRight size={15} /></div>)}</div>
      </section>
    </> : <section className="builder-page" id="top">
      <div className="builder-backdrop" />
      <div className="builder-heading"><button className="back-link" onClick={() => setView('arena')}>← VOLTAR À ARENA</button><div className="eyebrow"><span className="eyebrow-line" /> PERSONALIZE SEU ATLETA</div><h1>CRIE SEU <em>FIGHTER.</em></h1><p>Monte sua identidade, escolha suas skills e veja seu card ganhar forma.</p></div>
      <div className="builder-layout">
        <div className="builder-form">
          <section className="builder-block builder-modality-block"><div className="builder-step"><span>01</span><div><h2>ESCOLHA SUA MODALIDADE</h2><p>Escolha o estilo e o avatar acompanha o sexo selecionado.</p></div></div>
            <div className="gender-picker" role="group" aria-label="Sexo do avatar">{(['MASCULINO', 'FEMININO'] as const).map(gender => <button type="button" key={gender} aria-pressed={profile.division === gender} className={profile.division === gender ? 'gender-option active' : 'gender-option'} onClick={() => setProfile(current => ({ ...current, division: gender }))}><span>{gender === 'MASCULINO' ? '♂' : '♀'}</span>{gender}</button>)}</div>
            <div className="modality-grid">{styles.map((style, index) => <button type="button" key={style} aria-pressed={profile.style === style} onClick={() => setProfile(current => ({ ...current, style }))} className={profile.style === style ? 'modality-card selected' : 'modality-card'}><span className="modality-number">0{index + 1}</span><FighterFigure style={style} gender={selectedGender} face={profile.photo} crop={profile.faceCrop} /><span className="modality-name">{style}</span><small><Swords size={12} /> MODALIDADE</small><Check className="modality-check" size={15} /></button>)}</div>
          </section>
          <section className="builder-block"><div className="builder-step"><span>02</span><div><h2>MONTE SEU CARTEL</h2><p>Os detalhes que deixam seu atleta com a sua cara.</p></div></div>
            <div className="form-grid"><label>NOME NO CARD<input value={profile.name} onChange={event => setProfile(current => ({ ...current, name: event.target.value.toUpperCase() }))} maxLength={22} placeholder="SEU NOME" /></label><label>APELIDO DE ARENA<input value={profile.nickname} onChange={event => setProfile(current => ({ ...current, nickname: event.target.value.toUpperCase() }))} maxLength={22} placeholder="THE CONTENDER" /></label>
              <label className="full-width">EQUIPE<input value={profile.team} onChange={event => setProfile(current => ({ ...current, team: event.target.value.toUpperCase() }))} maxLength={24} placeholder="SUA EQUIPE" /></label>
            </div>
          </section>
          <section className="builder-block"><div className="builder-step"><span>03</span><div><h2>DEFINA SUAS SKILLS <small>ESCOLHA ATÉ 3</small></h2><p>Combine combate, estratégia e performance comercial.</p></div><strong className="skill-counter">{String(profile.skills.length).padStart(2, '0')} <i>/ 03</i></strong></div>
            <div className="skill-grid">{skillOptions.map((skill, index) => { const Icon = skill.icon; const selected = profile.skills.includes(skill.name); const locked = !selected && profile.skills.length >= 3; return <button key={skill.name} type="button" aria-pressed={selected} disabled={locked} onClick={() => toggleSkill(skill.name)} className={selected ? 'skill-card chosen' : 'skill-card'} style={{ '--skill-accent': skill.accent } as CSSProperties}><span className="skill-card-icon"><Icon size={18} /></span><span className="skill-index">0{index + 1}</span><span className="skill-type">{skill.type}</span><b>{skill.name}</b><small>{skill.detail}</small><span className="skill-meter-label">{skill.stat}<i>{skill.level}</i></span><span className="skill-meter"><i style={{ width: `${skill.level}%` }} /></span>{selected && <Check className="skill-check" size={15} />}</button>; })}</div>
          </section>
          <section className="builder-block upload-block"><div className="builder-step"><span>04</span><div><h2>ENCAIXE SEU ROSTO</h2><p>Envie uma foto frontal. O rosto entra no avatar como um recorte estilo JibJab.</p></div></div>
            <label className="upload-control"><Upload size={18} /><span>{profile.photo ? 'TROCAR FOTO DO ROSTO' : 'ENVIAR FOTO DO ROSTO'}</span><small>JPG, PNG ou WEBP · até 8 MB · prefira um rosto de frente</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadPhoto} /></label>
            {profile.photo && <div className="face-controls"><div className="face-control-preview"><FighterFigure style={profile.style} gender={selectedGender} face={profile.photo} crop={profile.faceCrop} /><span>PRÉVIA DO RECORTE</span></div><div className="face-sliders">{([{ key: 'x', label: 'ESQUERDA / DIREITA', min: 0, max: 100, step: 1 }, { key: 'y', label: 'ALTURA DO ROSTO', min: 0, max: 100, step: 1 }, { key: 'zoom', label: 'ZOOM', min: 1, max: 2.4, step: 0.05 }] as const).map(control => <label key={control.key}>{control.label}<input aria-label={control.label} type="range" min={control.min} max={control.max} step={control.step} value={profile.faceCrop[control.key]} onChange={event => setProfile(current => ({ ...current, faceCrop: { ...current.faceCrop, [control.key]: Number(event.target.value) } }))} /></label>)}</div></div>}
          </section>
          <button className="button-gold save-profile" onClick={saveProfile}>{profileSaved ? 'CARD SALVO NO DISPOSITIVO' : 'SALVAR MEU FIGHTER CARD'} <Check size={16} /></button>
          <p className="save-note">Seu rosto recortado, o enquadramento e o card são salvos juntos neste navegador.</p>
        </div>
        <aside className="card-preview-panel"><div className="preview-label"><span><i className="status-dot" /> PRÉVIA AO VIVO</span><span>UMC / ATHLETE CARD</span></div>
          <article className="athlete-card">
            <div className="athlete-card-top"><img src="/assets/umc-emblem.webp" alt="UMC" /><span>OCTAGON<br />SERIES · 2026</span><span className="card-edition">01<br />/ 03</span></div>
            <div className="athlete-art"><FighterFigure style={profile.style} gender={selectedGender} face={profile.photo} crop={profile.faceCrop} /><div className="art-class"><Swords size={13} /> {profile.style.toUpperCase()}<br /><b>{profile.division}</b></div><span className="art-rank">FIGHTER<br /><b>ROOKIE</b></span></div>
            <div className="athlete-card-info"><span className="card-nickname">{profile.nickname || 'THE CONTENDER'}</span><h3>{profile.name || 'SEU NOME'}</h3><div className="card-specs"><span>{profile.style}</span><i /><span>{profile.division}</span></div><div className="card-team"><span>TEAM</span><b>{profile.team || 'EQUIPE MENFE'}</b></div>
              <div className="card-skills-title"><span>SKILLS</span><small>{profile.skills.length}/03 EQUIPPED</small></div><div className="card-skills">{profile.skills.length ? profile.skills.map(skill => <span key={skill}><Zap size={11} />{skill}</span>) : <span className="empty-skill">ESCOLHA SUAS HABILIDADES</span>}</div>
            </div><div className="card-footer"><span>DISCIPLINA · ESTRATÉGIA · RESULTADO</span><b>UMC</b></div>
          </article>
          <div className="preview-status"><span><Check size={14} /> {profile.photo ? 'ROSTO ENCAIXADO NO AVATAR' : 'ENVIE SEU ROSTO PARA PERSONALIZAR'}</span><span>PERFIL VISUAL</span></div>
        </aside>
      </div>
    </section>}

    <footer className="site-footer"><img src="/assets/umc-emblem.webp" alt="UMC" /><span>USO INTERNO · MENFE INCORPORADORA</span><span>THE FIGHT FOR GREATNESS · 2026</span></footer>
    {notice && <div className="toast"><Check size={15} />{notice}</div>}
    {modal && <div className="modal-back" onClick={() => setModal(false)}><form className="modal" onSubmit={award} onClick={event => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setModal(false)} aria-label="Fechar"><X /></button><div className="eyebrow">DING DING · NOVA VITÓRIA</div><h2>REGISTRAR <em>RESULTADO.</em></h2><label>LUTADOR<select value={form.fighter} onChange={event => setForm(current => ({ ...current, fighter: event.target.value }))}>{fighters.map(fighter => <option key={fighter.name}>{fighter.name}</option>)}</select></label><label>VALOR DA VENDA (VGV)<input required type="number" min="1" value={form.value} onChange={event => setForm(current => ({ ...current, value: event.target.value }))} placeholder="Ex.: 249900" /></label><label>TIPO DE VITÓRIA<select value={form.result} onChange={event => setForm(current => ({ ...current, result: event.target.value }))}><option>Knockout · 1º round</option><option>Finalização · Submission</option><option>Vitória por pontos</option></select></label><label>HISTÓRIA DA LUTA <small>(OPCIONAL)</small><textarea value={form.note} onChange={event => setForm(current => ({ ...current, note: event.target.value }))} placeholder="Objeções, tempo de negociação, contexto…" /></label><button className="button-gold submit">CONFIRMAR VITÓRIA <ChevronRight size={16} /></button><p className="modal-help">Primeira venda do mês: premiação de R$ 500.</p></form></div>}
  </main>;
}

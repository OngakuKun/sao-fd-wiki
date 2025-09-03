import './App.css';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Fzf } from 'fzf'

import AppSettings from "./AppSettings";

function getDataURL() {
    if (process.env.NODE_ENV === "development") {
        return process.env.PUBLIC_URL + "/data.json";
    }
    return "https://raw.githubusercontent.com/OngakuKun/sao-fd-wiki/refs/heads/dev/data.json";
}

const LANG_EN = "en";
const LANG_DE = "de";


function getTranslation(obj, lang) {
    if (!obj || typeof obj !== "object") return obj || "";

    if ("i" in obj) return obj.i;

    if (obj[lang]) return obj[lang];

    const otherLang = lang === LANG_DE ? LANG_EN : LANG_DE;
    if (obj[otherLang]) return `[${otherLang.toUpperCase()}] ` + obj[otherLang];

    return "";
}

function getElementLabel(key, elements) {
    return elements[key] || `[MISSING] ${key}`
}

function Highlight({ text, indices }) {
    if (!text) return null;
    if (!indices || indices.size === 0) return <>{text}</>;

    const result = [];
    let buffer = "";
    let inHighlight = false;

    for (let i = 0; i < text.length; i++) {
        const shouldHighlight = indices.has(i);

        if (shouldHighlight !== inHighlight && buffer) {
            // flush previous buffer
            result.push(
                inHighlight ? <mark key={result.length}>{buffer}</mark> : <span key={result.length}>{buffer}</span>
            );
            buffer = "";
        }

        buffer += text[i];
        inHighlight = shouldHighlight;
    }

    // flush last buffer
    if (buffer) {
        result.push(
            inHighlight ? <mark key={result.length}>{buffer}</mark> : <span key={result.length}>{buffer}</span>
        );
    }

    return <>{result}</>;
}

function ExtractQuests({ title, questList, typeList, language }) {
    if (questList.length === 0) return null;

    return (
        <section>
            {/* Category header */}
            <h2 className="quest-type-header">
                <Highlight text={title} indices={questList[0]._indices?.categoryIndices} />
            </h2>
            <div className="quest-grid">
                {questList.map((quest, i) => (
                    <div key={`quest-${quest.id}-${i}`} className="quest-card interactive">
                        <h3>
                            <Highlight text={quest.nameText} indices={quest._indices?.nameIndices} />
                        </h3>
                        <p>
                            {`${typeList.weak[language]}: `}
                            <Highlight text={quest.weakText} indices={quest._indices?.weakIndices} />
                        </p>
                        <p>
                            {`${typeList.res[language]}: `}
                            <Highlight text={quest.resText} indices={quest._indices?.resIndices} />
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ExtractSpecialEffects({ title, effectList, language }) {
    if (effectList.length === 0) return null;

    return (
        <section>
            {/* Category header */}
            <h2 className="quest-type-header">
                <Highlight text={title} indices={effectList[0]._indices?.categoryIndices} />
            </h2>

            <div className="effect-grid">
                {effectList.map((effect, i) => (
                    <div key={`quest-${effect.id}-${i}`} className="quest-card interactive">
                        <h3>
                            <Highlight text={effect.nameText} indices={effect._indices?.nameIndices} />
                        </h3>
                        <p>
                            <Highlight text={effect.descText} indices={effect._indices?.descIndices} />
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function App() {
    const [data, setData] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [theme, setTheme] = useState("macchiato");
    const [accent, setAccent] = useState("blue");
    const [language, setLanguage] = useState(LANG_EN);
    const searchInputRef = useRef(null);
    const [query, setQuery] = useState("");
    const [filteredData, setFilteredData] = useState({
        bossQuests: [],
        coopQuests: [],
        specialEffects: []
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.style.setProperty(
            "--color-accent",
            `var(--ctp-${accent})`
        );
    }, [theme, accent]);

    useEffect(() => {
        const url = getDataURL();
        console.log("Fetching:", url);
        fetch(url)
            .then((res) => res.json())
            .then((json) => setData(json))
            .catch((err) => console.error('Error loading data:', err));
    }, []);

    const bossQuests = useMemo(() => {
        if (!data) return [];
        return data.quests
            .filter(q => q.id === "boss")
            .map(q => ({
                id: q.id,
                nameText: getTranslation(q.name, language),
                weakText: getElementLabel(q.weak, data.elements[language]),
                resText:  getElementLabel(q.res, data.elements[language])
            }));
    }, [data, language]);

    const coopQuests = useMemo(() => {
        if (!data) return [];
        return data.quests
            .filter(q => q.id === "coop")
            .map(q => ({
                id: q.id,
                nameText: getTranslation(q.name, language),
                weakText: getElementLabel(q.weak, data.elements[language]),
                resText:  getElementLabel(q.res, data.elements[language])
            }));
    }, [data, language]);

    const specialEffects = useMemo(() => {
        if (!data) return [];
        return data.specialeffects.map(piece => ({
            id: piece.id,
            entries: piece.entries.map(effect => ({
                nameText: getTranslation(effect.name, language),
                descText: getTranslation(effect.desc, language),
            }))
        }));
    }, [data, language]);

    const searchable = useMemo(() => {
        if (!data) return [];
        return [
            ...bossQuests.map(q => ({
                categoryKey: "bossQuests",
                category: getTranslation(data.types.boss, language),
                id: q.id,
                name: q.nameText,
                weak: q.weakText,
                res: q.resText
            })),
            ...coopQuests.map(q => ({
                categoryKey: "coopQuests",
                category: getTranslation(data.types.coop, language),
                id: q.id,
                name: q.nameText,
                weak: q.weakText,
                res: q.resText
            })),
            ...specialEffects.flatMap(piece =>
                piece.entries.map(effect => ({
                    categoryKey: "specialEffects",
                    category: getTranslation(data.types.specialeffects, language) + " - " + getTranslation(data.types[piece.id], language),
                    id: piece.id,
                    name: effect.nameText,
                    desc: effect.descText
                }))
            )
        ];
    }, [data, language, bossQuests, coopQuests, specialEffects]);

    const fzf = useMemo(() => new Fzf(searchable, {
        selector: (item) =>
            `${item.category}||${item.name}||${item.weak || ""}||${item.res || ""}||${item.desc || ""}`,
    }), [searchable]);

    useEffect(() => {
        if (!query) {
            setFilteredData({
                bossQuests,
                coopQuests,
                specialEffects,
            });
            return;
        }

        const matches = fzf.find(query).map(m => {
            const { item, positions } = m;
            const [category, name, weak, res] = [
                item.category,
                item.name,
                item.weak || "",
                item.res || "",
            ];

            // Calculate boundaries for each field
            const categoryEnd = category.length;
            const nameStart = categoryEnd + 2;
            const nameEnd = nameStart + name.length;
            const weakStart = nameEnd + 2;
            const weakEnd = weakStart + weak.length;
            const resStart = weakEnd + 2;
            const resEnd = resStart + res.length;
            const descStart = resEnd + 2;

            const posArray = Array.from(positions);

            // Split match indices per field
            const categoryIndices = new Set(
                posArray.filter(i => i < categoryEnd)
            );
            const nameIndices = new Set(
                posArray.filter(i => i >= nameStart && i < nameEnd).map(i => i - nameStart)
            );
            const weakIndices = new Set(
                posArray.filter(i => i >= weakStart && i < weakEnd).map(i => i - weakStart)
            );
            const resIndices = new Set(
                posArray.filter(i => i >= resStart && i < resEnd).map(i => i - resStart)
            );
            const descIndices = new Set(
                posArray.filter(i => i >= descStart).map(i => i - descStart)
            );

            return {
                ...item,
                _indices: { categoryIndices, nameIndices, weakIndices, resIndices, descIndices },
            };
        });

        const grouped = {
            bossQuests: matches
            .filter(m => m.categoryKey === "bossQuests")
            .map(m => ({
                id: m.id,
                nameText: m.name,
                weakText: m.weak,
                resText: m.res,
                _indices: m._indices,
            })),
            coopQuests: matches
            .filter(m => m.categoryKey === "coopQuests")
            .map(m => ({
                id: m.id,
                nameText: m.name,
                weakText: m.weak,
                resText: m.res,
                _indices: m._indices,
            })),
            specialEffects: Object.values(
                matches
                    .filter(m => m.categoryKey === "specialEffects")
                    .reduce((acc, m) => {
                        if (!acc[m.id]) acc[m.id] = { id: m.id, entries: [] };
                        acc[m.id].entries.push({
                            nameText: m.name,
                            descText: m.desc,
                            _indices: m._indices,
                        });
                        return acc;
                    }, {})
            ),
        };


        setFilteredData(grouped);
    }, [query, fzf, bossQuests, coopQuests, specialEffects]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
                setQuery('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <div className="App-header-title">
                    Sword Art Online: Fractured Daydream Wiki
                </div>
                <input
                    id="search-input"
                    type="text"
                    ref={searchInputRef}
                    placeholder="Press / to fuzzy-search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            setQuery("");
                            searchInputRef.current?.blur();
                        }
                    }}
                    className="App-header-search-bar interactive"
                />
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="settings-btn interactive"
                    >
                    <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true">
                    <path fill="var(--color-accent)" d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/>
                    </svg>
                    </button>
            </header>
            <main>
                {data ? (
                    <>
                        <ExtractQuests
                            title={getTranslation(data.types.boss, language)}
                            questList={filteredData.bossQuests}
                            typeList={data.types}
                            language={language}
                        />

                        <ExtractQuests
                            title={getTranslation(data.types.coop, language)}
                            questList={filteredData.coopQuests}
                            typeList={data.types}
                            language={language}
                        />

                        {filteredData.specialEffects.map((piece, i) => (
                            <ExtractSpecialEffects
                                key={`quest-${piece.id}-${i}`}
                                title={getTranslation(data.types.specialeffects, language) + " - " + getTranslation(data.types[piece.id], language)}
                                effectList={piece.entries}
                                effectId={piece.id}
                            />
                        ))}
                    </>
                ) : (
                        <div>Loading...</div>
                    )}
            </main>
            <AppSettings
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                theme={theme}
                setTheme={setTheme}
                accent={accent}
                setAccent={setAccent}
                language={language}
                setLanguage={setLanguage}
            />
            <footer>
                Made with GithubPages and React
            </footer>
        </div>
    );
}


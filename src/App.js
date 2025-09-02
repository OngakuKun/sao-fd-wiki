import './App.css';
import { useEffect, useMemo, useState } from 'react';
import { Fzf } from 'fzf'

function getDataURL() {
    if (process.env.NODE_ENV === "development") {
        return process.env.PUBLIC_URL + "/data.json";
    }
    return "https://raw.githubusercontent.com/OngakuKun/sao-fd-wiki/refs/heads/dev/data.json";
}

const LANG_EN = "en";
const LANG_DE = "de";

function LanguageSwitcher({ language, setLanguage }) {
    const [open, setOpen] = useState(false);

    const languages = [
        { code: "en", label: "English", flag: "🇬🇧" },
        { code: "de", label: "Deutsch", flag: "🇩🇪" },
    ];

    const current = languages.find(l => l.code === language);

    return (
        <div className="lang-switcher">
            <button onClick={() => setOpen(!open)} className="lang-btn">
                <span className="flag">{current.flag}</span> {current.label} ▾
            </button>
            {open && (
                <ul className="lang-dropdown">
                    {languages.map(l => (
                        <li key={l.code}>
                            <button
                                onClick={() => {
                                    setLanguage(l.code);
                                    setOpen(false);
                                }}
                            >
                                <span className="flag">{l.flag}</span> {l.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

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

function ExtractQuests({ title, questList = [], typeList, language }) {
    if (!questList.length) return null;

    return (
        <section>
            <h2 className="quest-type-header">{title}</h2>
            <div className="quest-grid">
                {questList.map((quest, index) => (
                    <div key={quest.id + index} className="quest-card">
                        <h3>{quest.nameText}</h3>
                        <p>{`${typeList.weak[language]}: ${quest.weakText}`}</p>
                        <p>{`${typeList.res[language]}: ${quest.resText}`}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ExtractSpecialEffects({ title, effectList = [], effectId}) {
  if (!effectList.length) return null;


    return (
        <section>
            <h2 className="effect-type-header">{title}</h2>
            <div className="effect-grid">
                {effectList.map((effect, index) => (
                    <div key={effectId + index} className="effect-card">
                        <h3>{effect.nameText}</h3>
                        <p>{effect.descText}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function App() {
    const [data, setData] = useState(null);
    const [language, setLanguage] = useState(LANG_EN);
    const [query, setQuery] = useState("");
    const [filteredData, setFilteredData] = useState({
        bossQuests: [],
        coopQuests: [],
        specialEffects: []
    });

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
        selector: (item) => `${item.category} (${item.name} ${item.weak || ""} ${item.res || ""} ${item.desc || ""})`,
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

        const matches = fzf.find(query).map(m => m.item);

        const grouped = {
            bossQuests: matches
            .filter(m => m.categoryKey === "bossQuests")
            .map(m => ({
                id: m.id,
                nameText: m.name,
                weakText: m.weak,
                resText: m.res
            })),
            coopQuests: matches
            .filter(m => m.categoryKey === "coopQuests")
            .map(m => ({
                id: m.id,
                nameText: m.name,
                weakText: m.weak,
                resText: m.res
            })),
            specialEffects: Object.values(
                matches
                    .filter(m => m.categoryKey === "specialEffects")
                    .reduce((acc, m) => {
                        if (!acc[m.id]) acc[m.id] = { id: m.id, entries: [] };
                        acc[m.id].entries.push({
                            nameText: m.name,
                            descText: m.desc
                        });
                        return acc;
                    }, {})
            )
        };

        setFilteredData(grouped);
    }, [query, fzf, bossQuests, coopQuests, specialEffects]);

        console.log("Filtered Data", filteredData)

    return (
        <div className="App">
            <header className="App-header">
                <div className="App-header-title">
                    Sword Art Online: Fractured Daydream Wiki
                </div>
                <div className="App-header-search">
                    <span>Press <kbd className="App-header-search-kbd">/</kbd> to search</span>
                </div>
                {/* Language Switch */}
                <div className="App-header-lang">
                    <LanguageSwitcher language={language} setLanguage={setLanguage} />
                </div>
            </header>
            <main>
                {data ? (
                    <>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />

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
                                key={piece.id + i}
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
            <footer>
                Made with GithubPages and React
            </footer>
        </div>
    );
}


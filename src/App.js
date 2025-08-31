import './App.css';
import { useEffect, useState } from 'react';

const LANG_EN = "en";
const LANG_DE = "de";

function getTranslation(obj, lang) {
  if (!obj || typeof obj !== "object") return obj || "";

  if (obj[lang]) return obj[lang];

  const otherLang = lang === LANG_DE ? LANG_EN : LANG_DE;
  if (obj[otherLang]) return `[${otherLang.toUpperCase()}] ` + obj[otherLang];

  return "";
}

function getElementLabel(key, elements) {
    return elements[key] || `[MISSING] ${key}`
}

function ExtractQuests({title, questList, typeList, language}) {
    return (
        <div>
            <h2 className="quest-type-header"> {title} </h2>
            <div className="quest-grid">
                {questList.map((quest, index) => (
                    <div key={quest.id + index} className="quest-card">
                        <h3>{quest.nameText}</h3>
                        <p> {typeList.weak[language] + ": " + quest.weakText} </p>
                        <p> {typeList.res[language] + ": " + quest.resText} </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function App() {
    const [data, setData] = useState(null);
    const [language, setLanguage] = useState(LANG_EN);

    useEffect(() => {
        fetch(process.env.PUBLIC_URL + '/Data.json')
            .then((res) => res.json())
            .then((json) => setData(json))
            .catch((err) => console.error('Error loading data:', err));
    }, []);
    
    let bossQuests = []
    let coopQuests = []

    if (data) {
        bossQuests = data.quests
            .filter(q => q.id === "boss")
            .map(q => ({
                ...q,
                nameText: getTranslation(q.name, language),
                weakText: getElementLabel(q.weak, data.elements[language]),
                resText:  getElementLabel(q.res, data.elements[language])
            }));
        coopQuests = data.quests
            .filter(q => q.id === "coop")
            .map(q => ({
                ...q,
                nameText: getTranslation(q.name, language),
                weakText: getElementLabel(q.weak, data.elements[language]),
                resText:  getElementLabel(q.res, data.elements[language])
            }));
    }

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
                    <button onClick={() => setLanguage(LANG_EN)}>English</button>
                    <button onClick={() => setLanguage(LANG_DE)}>Deutsch</button>
                </div>
            </header>
            <main>
                {data ? (
                    <>
                <ExtractQuests
                    title={getTranslation(data.types.boss, language)}
                    questList={bossQuests}
                    typeList={data.types}
                    language={language}
                    />
                <ExtractQuests
                    title={getTranslation(data.types.coop, language)}
                    questList={coopQuests}
                    typeList={data.types}
                    language={language}
                    />
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

export default App;

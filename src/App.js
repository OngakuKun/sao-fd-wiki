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

function ExtractQuests({questTypeId, questList, elementList, typeList, language}) {
    const filteredQuests = questList.filter((quest) => quest.id === questTypeId);

    return (
        <div>
            <h2 className="quest-type-header">
                {typeList[questTypeId]?.[language] || getTranslation(typeList[questTypeId], language)}
            </h2>
            <div className="quest-grid">
                {filteredQuests.map((quest) => (
                    <div key={quest.id + quest.name.en} className="quest-card">
                        <h3>{getTranslation(quest.name, language)}</h3>
                        <p> {typeList.weak[language] + ": " + getElementLabel(quest.weak, elementList)} </p>
                        <p> {typeList.res[language] + ": " + getElementLabel(quest.res, elementList)} </p>
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

    if (!data) return <div>Loading...</div>;

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
                <ExtractQuests
                    questTypeId="boss"
                    questList={data.quests}
                    elementList={data.elements[language]}
                    typeList={data.types}
                    language={language}
                />
                <ExtractQuests
                    questTypeId="coop"
                    questList={data.quests}
                    elementList={data.elements[language]}
                    typeList={data.types}
                    language={language}
                />
            </main>
            <footer>
                Made with GithubPages and React
            </footer>
        </div>
    );
}

export default App;

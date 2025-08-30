import './App.css';
import { useEffect, useState } from 'react';

function getTranslation(obj, lang) {
  if (!obj || typeof obj !== "object") return obj || "";

  if (obj[lang]) return obj[lang];

  const otherLang = lang === "de" ? "en" : "de";
  if (obj[otherLang]) return `[${otherLang.toUpperCase()}] ` + obj[otherLang];

  return "";
}

function ExtractQuests({questTypeId, quests, elements, types, language}) {
    const filteredQuests = quests.filter((quest) => quest.id === questTypeId);

    return (
        <div>
            <h2 className="quest-type-header">{types[questTypeId][language]}</h2>
            <div className="quest-grid">
                {filteredQuests.map((quest) => (
                    <div key={quest.id + quest.name.en} className="quest-card">
                        <h3>{getTranslation(quest.name, language)}</h3>
                        <p>
                            {types.weak[language]}{": "}
                            {elements[quest.weak] || quest.weak}
                        </p>
                        <p>
                            {types.res[language]}{": "}
                            {elements[quest.res] || quest.res}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function App() {
    const [data, setData] = useState(null);
    const [language, setLanguage] = useState("en");

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
                    <button onClick={() => setLanguage("en")}>English</button>
                    <button onClick={() => setLanguage("de")}>Deutsch</button>
                </div>
            </header>
            <main>
                <ExtractQuests
                    questTypeId="boss"
                    quests={data.quests}
                    elements={data.elements[language]}
                    types={data.types}
                    language={language}
                />
                <ExtractQuests
                    questTypeId="coop"
                    quests={data.quests}
                    elements={data.elements[language]}
                    types={data.types}
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

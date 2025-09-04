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

function LastUpdate() {
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        fetch("https://api.github.com/repos/OngakuKun/sao-fd-wiki/commits?path=data.json&per_page=1")
            .then((res) => res.json())
            .then((data) => {
                if (data.length > 0) {
                    const date = new Date(data[0].commit.committer.date);
                    setLastUpdated(date.toLocaleDateString());
                }
            })
            .catch((err) => console.error("Error fetching last update:", err));
    }, []);

    return (
        <span className="btn-span">
            {lastUpdated ? `Data version: ${lastUpdated}` : "Loading..."}
        </span>
    );
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
                    <div key={`quest-${quest.id}-${i}`} className="quest-card interactive-glow">
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
                    <div key={`quest-${effect.id}-${i}`} className="quest-card interactive-glow">
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
                <div className="App-header-controls">
                    <input
                        id="search-input"
                        type="text"
                        className="App-header-search-bar interactive interactive-focus"
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
                    />
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="settings-btn interactive"
                    >
                    <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true">
                        <path fill="var(--color-accent)" d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/>
                    </svg>
                    </button>
                </div>
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
                <div className="left-buttons">
                <button
                    className="github-btn interactive"
                    onClick={() => window.open("https://github.com/OngakuKun/sao-fd-wiki", "_blank")}
                >
                    <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true">
                        <path fill="var(--color-accent)" d="M237.9 461.4C237.9 463.4 235.6 465 232.7 465C229.4 465.3 227.1 463.7 227.1 461.4C227.1 459.4 229.4 457.8 232.3 457.8C235.3 457.5 237.9 459.1 237.9 461.4zM206.8 456.9C206.1 458.9 208.1 461.2 211.1 461.8C213.7 462.8 216.7 461.8 217.3 459.8C217.9 457.8 216 455.5 213 454.6C210.4 453.9 207.5 454.9 206.8 456.9zM251 455.2C248.1 455.9 246.1 457.8 246.4 460.1C246.7 462.1 249.3 463.4 252.3 462.7C255.2 462 257.2 460.1 256.9 458.1C256.6 456.2 253.9 454.9 251 455.2zM316.8 72C178.1 72 72 177.3 72 316C72 426.9 141.8 521.8 241.5 555.2C254.3 557.5 258.8 549.6 258.8 543.1C258.8 536.9 258.5 502.7 258.5 481.7C258.5 481.7 188.5 496.7 173.8 451.9C173.8 451.9 162.4 422.8 146 415.3C146 415.3 123.1 399.6 147.6 399.9C147.6 399.9 172.5 401.9 186.2 425.7C208.1 464.3 244.8 453.2 259.1 446.6C261.4 430.6 267.9 419.5 275.1 412.9C219.2 406.7 162.8 398.6 162.8 302.4C162.8 274.9 170.4 261.1 186.4 243.5C183.8 237 175.3 210.2 189 175.6C209.9 169.1 258 202.6 258 202.6C278 197 299.5 194.1 320.8 194.1C342.1 194.1 363.6 197 383.6 202.6C383.6 202.6 431.7 169 452.6 175.6C466.3 210.3 457.8 237 455.2 243.5C471.2 261.2 481 275 481 302.4C481 398.9 422.1 406.6 366.2 412.9C375.4 420.8 383.2 435.8 383.2 459.3C383.2 493 382.9 534.7 382.9 542.9C382.9 549.4 387.5 557.3 400.2 555C500.2 521.8 568 426.9 568 316C568 177.3 455.5 72 316.8 72zM169.2 416.9C167.9 417.9 168.2 420.2 169.9 422.1C171.5 423.7 173.8 424.4 175.1 423.1C176.4 422.1 176.1 419.8 174.4 417.9C172.8 416.3 170.5 415.6 169.2 416.9zM158.4 408.8C157.7 410.1 158.7 411.7 160.7 412.7C162.3 413.7 164.3 413.4 165 412C165.7 410.7 164.7 409.1 162.7 408.1C160.7 407.5 159.1 407.8 158.4 408.8zM190.8 444.4C189.2 445.7 189.8 448.7 192.1 450.6C194.4 452.9 197.3 453.2 198.6 451.6C199.9 450.3 199.3 447.3 197.3 445.4C195.1 443.1 192.1 442.8 190.8 444.4zM179.4 429.7C177.8 430.7 177.8 433.3 179.4 435.6C181 437.9 183.7 438.9 185 437.9C186.6 436.6 186.6 434 185 431.7C183.6 429.4 181 428.4 179.4 429.7z"/>
                    </svg>
                    <span className="btn-span"> Github Repository </span>
                </button>
                <button
                    className="datav-btn interactive"
                    onClick={() => window.open("https://github.com/OngakuKun/sao-fd-wiki/blob/dev/data.json", "_blank")}
                >
                    <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true">
                        <path fill="var(--color-accent)" d="M192 64C156.7 64 128 92.7 128 128L128 368L310.1 368L279.1 337C269.7 327.6 269.7 312.4 279.1 303.1C288.5 293.8 303.7 293.7 313 303.1L385 375.1C394.4 384.5 394.4 399.7 385 409L313 481C303.6 490.4 288.4 490.4 279.1 481C269.8 471.6 269.7 456.4 279.1 447.1L310.1 416.1L128 416.1L128 512.1C128 547.4 156.7 576.1 192 576.1L448 576.1C483.3 576.1 512 547.4 512 512.1L512 234.6C512 217.6 505.3 201.3 493.3 189.3L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z"/>
                    </svg>
                    <LastUpdate/>
                </button>
                </div>
                <div className="center-buttons">
                <button
                    className="website-btn interactive"
                    onClick={() => window.open("https://en.bandainamcoent.eu/sword-art-online/sword-art-online-fractured-daydream", "_blank")}
                >
                    <span className="btn-span"> Game Website </span>
                    <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true">
                        <path fill="var(--color-accent)" d="M415.9 344L225 344C227.9 408.5 242.2 467.9 262.5 511.4C273.9 535.9 286.2 553.2 297.6 563.8C308.8 574.3 316.5 576 320.5 576C324.5 576 332.2 574.3 343.4 563.8C354.8 553.2 367.1 535.8 378.5 511.4C398.8 467.9 413.1 408.5 416 344zM224.9 296L415.8 296C413 231.5 398.7 172.1 378.4 128.6C367 104.2 354.7 86.8 343.3 76.2C332.1 65.7 324.4 64 320.4 64C316.4 64 308.7 65.7 297.5 76.2C286.1 86.8 273.8 104.2 262.4 128.6C242.1 172.1 227.8 231.5 224.9 296zM176.9 296C180.4 210.4 202.5 130.9 234.8 78.7C142.7 111.3 74.9 195.2 65.5 296L176.9 296zM65.5 344C74.9 444.8 142.7 528.7 234.8 561.3C202.5 509.1 180.4 429.6 176.9 344L65.5 344zM463.9 344C460.4 429.6 438.3 509.1 406 561.3C498.1 528.6 565.9 444.8 575.3 344L463.9 344zM575.3 296C565.9 195.2 498.1 111.3 406 78.7C438.3 130.9 460.4 210.4 463.9 296L575.3 296z"/>
                    </svg>
                </button>
                <button
                    className="steam-btn interactive"
                    onClick={() => window.open("https://store.steampowered.com/app/1858630/SWORD_ART_ONLINE_Fractured_Daydream/", "_blank")}
                >
                    <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true">
                        <path fill="var(--color-accent)" d="M568 320C568 457 456.8 568 319.6 568C205.8 568 110 491.7 80.6 387.6L175.8 426.9C182.2 459 210.7 483.3 244.7 483.3C283.9 483.3 316.6 450.9 314.9 409.8L399.4 349.6C451.5 350.9 495.2 308.7 495.2 256.1C495.2 204.5 453.2 162.6 401.5 162.6C349.8 162.6 307.8 204.6 307.8 256.1L307.8 257.3L248.6 343C233.1 342.1 217.9 346.4 205.1 355.1L72 300.1C82.2 172.4 189.1 72 319.6 72C456.8 72 568 183 568 320zM227.7 448.3L197.2 435.7C202.8 447.3 212.5 456.5 224.4 461.5C251.3 472.7 282.2 459.9 293.4 433.1C298.8 420.1 298.9 405.8 293.5 392.8C288.1 379.8 278 369.6 265 364.2C252.1 358.8 238.3 359 226.1 363.6L257.6 376.6C277.4 384.8 286.8 407.5 278.5 427.3C270.2 447.2 247.5 456.5 227.7 448.3zM401.5 193.8C435.9 193.8 463.8 221.7 463.8 256.1C463.8 290.5 435.9 318.4 401.5 318.4C367.1 318.4 339.2 290.5 339.2 256.1C339.2 221.7 367.1 193.8 401.5 193.8zM401.6 302.8C427.4 302.8 448.4 281.8 448.4 256C448.4 230.2 427.4 209.2 401.6 209.2C375.8 209.2 354.8 230.2 354.8 256C354.8 281.8 375.8 302.8 401.6 302.8z"/>
                    </svg>
                    <span className="btn-span"> Game on Steam </span>
                </button>
                </div>
                <div className="right-buttons">
                <button className="copyright-btn interactive-glow">
                    <span className="btn-span"> This project is not affiliated with Bandai Namco </span>
                    <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true">
                        <path fill="var(--color-accent)" d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM269.1 370.9C297.2 399 342.8 399 370.9 370.9C380.3 361.5 395.5 361.5 404.8 370.9C414.1 380.3 414.2 395.5 404.8 404.8C357.9 451.7 282 451.7 235.1 404.8C188.2 357.9 188.2 282 235.1 235.1C282 188.2 357.9 188.2 404.8 235.1C414.2 244.5 414.2 259.7 404.8 269C395.4 278.3 380.2 278.4 370.9 269C342.8 240.9 297.2 240.9 269.1 269C241 297.1 241 342.7 269.1 370.8z"/>
                    </svg>
                </button>
                </div>
            </footer>
        </div>
    );
}


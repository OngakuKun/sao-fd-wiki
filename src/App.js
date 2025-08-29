import './App.css';

const quests = [
    { type: 'Coop Quest', name: 'Woods of Recollection', weak: 'Electric', res: 'Wind' },
    { type: 'Coop Quest', name: 'Abandoned Facility', weak: 'Water', res: 'Fire' },
    { type: 'Coop Quest', name: 'Jade Maze', weak: 'Light', res: 'Dark' },
    { type: 'Coop Quest', name: 'Ruins of Truth and Lies', weak: 'Wind', res: 'Electric' },
    { type: 'Coop Quest', name: 'Woodland of Vitality', weak: 'Fire', res: 'Water' },
    { type: 'Coop Quest', name: 'Amber Maze', weak: 'Dark', res: 'Light' },
    { type: 'Coop Quest', name: 'Woods of Pluto', weak: 'Light', res: 'Dark' },
    { type: 'Coop Quest', name: 'Toxic Ruins', weak: 'Wind', res: 'Electric' },
    { type: 'Coop Quest', name: 'Poisoned Facility', weak: 'Fire', res: 'Water' },
    { type: 'Boss Raid', name: 'Skull Reaper', weak: 'Light', res: 'Dark' },
    { type: 'Boss Raid', name: 'SBC Trommel', weak: 'Electric', res: 'Wind' },
    { type: 'Boss Raid', name: 'Kraken the Abyss Lord', weak: 'Fire', res: 'Water' },
    { type: 'Boss Raid', name: 'Sword Golem', weak: 'Dark', res: 'Light' },
    { type: 'Boss Raid', name: 'Dorz\'l the Chaos Drake', weak: 'Water', res: 'Fire' },
    { type: 'Boss Raid', name: 'Fuscus the Vacant Colossus', weak: 'Wind', res: 'Electric' },
]

function ExtractQuests({questType}) {
    return (
        <div>
            <h2 className='quest-type-header'> --- {questType} --- </h2>
            <div className='quest-grid'>
                {quests
                    .filter((quest) => quest.type === questType)
                    .map((quest, index) => (
                        <div key={index} className='quest-card'>
                            <h3>{quest.name}</h3>
                            <p>Weak: {quest.weak}</p>
                            <p>Resistence: {quest.res} </p>
                        </div>
                    ))}
            </div>
        </div>
    )
}

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <div className="App-header-title">
                    Sword Art Online: Fractured Daydream Wiki
                </div>
            </header>
            <main>
                <ExtractQuests questType='Boss Raid' />
                <ExtractQuests questType='Coop Quest' />
            </main>
            <footer>
                Made with GithubPages and React
            </footer>
        </div>
    );
}

export default App;

import { pingBackend } from './api';


function App() {
  return (
    <div className="container">
      <h1>Welcome</h1>
      <p>This is a clean boilerplate ready for development.</p>
      <button onClick={() => pingBackend()}>Ping Backend</button>
    </div>
  );
}

export default App;

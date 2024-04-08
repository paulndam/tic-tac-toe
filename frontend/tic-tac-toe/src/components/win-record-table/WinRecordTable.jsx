import "./style.css"

const WinRecordsTable = ({ winRecords }) => {
    return (
      <div className="win-records-table">
        <h2>Win Records</h2>
        <table>
          <thead>
            <tr>
              <th>Player Name</th>
              <th>Wins</th>
            </tr>
          </thead>
          <tbody>
            {winRecords.map((record, index) => (
              <tr key={index}>
                <td>{record.playerName}</td>
                <td>{record.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default WinRecordsTable;
  
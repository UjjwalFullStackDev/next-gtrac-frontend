import { PRODUCTION_API_ENDPOINT } from "@/utils/constants";
import { useState } from "react";

export default function ActivityHistoryModal({
  modalRef,
  closeModal,
}: {
  modalRef: React.RefObject<HTMLDivElement | null>;
  closeModal: () => void;
}) {
  const [isTodayLogButtonActive, setIsTodayLogButtonActive] = useState(false);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${PRODUCTION_API_ENDPOINT}/ambulance/login/records`
      );
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      setActivityData(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load activity data.");
    } finally {
      setLoading(false);
    }
  };

  const handleTodayLogsClick = () => {
    const nextState = !isTodayLogButtonActive;
    setIsTodayLogButtonActive(nextState);
    if (nextState) {
      fetchData();
    }
  };

  return (
    <div className="absolute top-[7vh] left-0 w-screen h-[93vh] flex z-50">
      <div className="w-[75rem] h-full backdrop-blur-[1px]" />
      <div ref={modalRef} className="w-[150rem] md:w-[25rem] h-full bg-white shadow-lg p-4 flex flex-col">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Recent Activities</h2>
          <button onClick={closeModal} className="text-xl font-bold cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24">
              <path fill="#000" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z" strokeWidth={0.5} stroke="#000"></path>
            </svg>
          </button>
        </div>
        <hr className="h-px bg-gray-300 border-0 mt-2" />
        <div className="flex flex-wrap items-center space-x-2 my-3">
          <button className={`text-sm rounded p-1 cursor-pointer border outline-none ${isTodayLogButtonActive ? "text-indigo-600 border-indigo-600" : "text-gray-400 border-gray-400"}`} onClick={handleTodayLogsClick}>Today's Logs {activityData.length > 0 && isTodayLogButtonActive ? `(${activityData.filter((item) => !item.ambulanceNumber.toLowerCase().startsWith('itg')).length})` : ''}</button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : isTodayLogButtonActive ? (
          activityData.length > 0 ? (
            <div className="h-[80vh] overflow-y-auto no-scrollbar space-y-3">
              {activityData.sort((a, b) => b.deviceLoginAt - a.deviceLoginAt).filter((amb) => !amb.ambulanceNumber.toLowerCase().startsWith('itg')).map((record, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} viewBox="0 0 24 24" className="text-blue-600">
                      <path fill="currentColor" fillRule="evenodd" d="M21.007 8.27C22.194 9.125 23 10.45 23 12s-.806 2.876-1.993 3.73c.24 1.442-.134 2.958-1.227 4.05c-1.095 1.095-2.61 1.459-4.046 1.225C14.883 22.196 13.546 23 12 23c-1.55 0-2.878-.807-3.731-1.996c-1.438.235-2.954-.128-4.05-1.224c-1.095-1.095-1.459-2.611-1.217-4.05C1.816 14.877 1 13.551 1 12s.816-2.878 2.002-3.73c-.242-1.439.122-2.955 1.218-4.05c1.093-1.094 2.61-1.467 4.057-1.227C9.125 1.804 10.453 1 12 1c1.545 0 2.88.803 3.732 1.993c1.442-.24 2.956.135 4.048 1.227s1.468 2.608 1.227 4.05m-4.426-.084a1 1 0 0 1 .233 1.395l-5 7a1 1 0 0 1-1.521.126l-3-3a1 1 0 0 1 1.414-1.414l2.165 2.165l4.314-6.04a1 1 0 0 1 1.395-.232" clipRule="evenodd" strokeWidth={0.5} stroke="currentColor"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 leading-relaxed">
                      <span className="font-semibold">{record.ambulanceNumber}</span> has logged in from{" "}
                      <span className="font-medium capitalize">{record.manufacturer ? record.manufacturer : '~~'}</span>, device model :{" "}
                      <span className="font-medium">{record.deviceModelName ? record.deviceModelName : '~~'}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(record.deviceLoginAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No logs for today.</p>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center overflow-auto mt-4">
              <div className="flex flex-col items-center space-y-8">
                  <svg width="280" height="265" viewBox="0 0 137 109" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M80.2501 39.54C71.8701 39.59 63.3601 39.2 55.4001 36.99C47.4401 34.78 40.4001 30.61 34.0001 25.74C29.8101 22.57 26.0001 20.05 20.5601 20.43C15.2411 20.7095 10.1535 22.6941 6.05009 26.09C-0.869909 32.15 0.180093 43.35 2.94009 51.23C7.10009 63.1 19.7601 71.34 30.5101 76.71C42.9401 82.92 56.5901 86.53 70.2801 88.6C82.2801 90.42 97.6901 91.75 108.08 83.91C117.63 76.72 120.25 60.28 117.91 49.18C117.341 45.9015 115.595 42.9433 113 40.86C106.29 35.96 96.2901 39.23 88.7501 39.4C86.0001 39.46 83.1101 39.53 80.2501 39.54Z" fill="#F2F2F2"/>
                  <path d="M39.3899 0.72998V5.02998" stroke="#CFCFCF" strokeWidth="0.85" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M37.24 2.88H41.54" stroke="#CFCFCF" strokeWidth="0.85" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M120.97 86.4399V90.7399" stroke="#CFCFCF" strokeWidth="0.85" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M118.82 88.59H123.12" stroke="#CFCFCF" strokeWidth="0.85" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.89992 67.87C7.44116 67.87 7.87992 67.4313 7.87992 66.89C7.87992 66.3488 7.44116 65.91 6.89992 65.91C6.35868 65.91 5.91992 66.3488 5.91992 66.89C5.91992 67.4313 6.35868 67.87 6.89992 67.87Z" fill="#CFCFCF"/>
                  <path d="M90.3401 5.16996C90.8813 5.16996 91.3201 4.7312 91.3201 4.18996C91.3201 3.64872 90.8813 3.20996 90.3401 3.20996C89.7989 3.20996 89.3601 3.64872 89.3601 4.18996C89.3601 4.7312 89.7989 5.16996 90.3401 5.16996Z" fill="#CFCFCF"/>
                  <path d="M63.18 108.04C83.4488 108.04 99.88 107.019 99.88 105.76C99.88 104.501 83.4488 103.48 63.18 103.48C42.9111 103.48 26.48 104.501 26.48 105.76C26.48 107.019 42.9111 108.04 63.18 108.04Z" fill="#F2F2F2"/>
                  <path d="M34.9101 12.41H88.2101C89.5362 12.41 90.8079 12.9368 91.7456 13.8745C92.6833 14.8122 93.2101 16.084 93.2101 17.41V80.82C93.2101 82.1461 92.6833 83.4179 91.7456 84.3556C90.8079 85.2933 89.5362 85.82 88.2101 85.82H28.0801C26.754 85.82 25.4822 85.2933 24.5445 84.3556C23.6069 83.4179 23.0801 82.1461 23.0801 80.82V24.36L34.9101 12.41Z" fill="white" stroke="#BABABA" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M92.97 43.3101H38.01V86.4301H92.97V43.3101Z" fill="#D2D2D2"/>
                  <path d="M23.0801 24.36H32.7701C33.3386 24.3574 33.8829 24.1297 34.2839 23.7268C34.6849 23.3239 34.9101 22.7785 34.9101 22.21V12.41L23.0801 24.36Z" fill="white" stroke="#BABABA" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M92.7 29.54H38.34C36.2248 29.54 34.51 31.2548 34.51 33.37V45C34.51 47.1153 36.2248 48.83 38.34 48.83H92.7C94.8153 48.83 96.53 47.1153 96.53 45V33.37C96.53 31.2548 94.8153 29.54 92.7 29.54Z" fill="white" stroke="#BABABA" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M45.07 42.55C46.9146 42.55 48.41 41.0546 48.41 39.21C48.41 37.3654 46.9146 35.87 45.07 35.87C43.2253 35.87 41.73 37.3654 41.73 39.21C41.73 41.0546 43.2253 42.55 45.07 42.55Z" fill="#D2D2D2"/>
                  <path d="M55.57 42.55C57.4146 42.55 58.91 41.0546 58.91 39.21C58.91 37.3654 57.4146 35.87 55.57 35.87C53.7253 35.87 52.23 37.3654 52.23 39.21C52.23 41.0546 53.7253 42.55 55.57 42.55Z" fill="#D2D2D2"/>
                  <path d="M66.06 42.55C67.9046 42.55 69.4 41.0546 69.4 39.21C69.4 37.3654 67.9046 35.87 66.06 35.87C64.2153 35.87 62.72 37.3654 62.72 39.21C62.72 41.0546 64.2153 42.55 66.06 42.55Z" fill="#D2D2D2"/>
                  <path d="M92.7 50.92H38.34C36.2248 50.92 34.51 52.6348 34.51 54.75V66.38C34.51 68.4953 36.2248 70.21 38.34 70.21H92.7C94.8153 70.21 96.53 68.4953 96.53 66.38V54.75C96.53 52.6348 94.8153 50.92 92.7 50.92Z" fill="white" stroke="#BABABA" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M45.07 63.94C46.9146 63.94 48.41 62.4446 48.41 60.6C48.41 58.7554 46.9146 57.26 45.07 57.26C43.2253 57.26 41.73 58.7554 41.73 60.6C41.73 62.4446 43.2253 63.94 45.07 63.94Z" fill="#D2D2D2"/>
                  <path d="M55.57 63.94C57.4146 63.94 58.91 62.4446 58.91 60.6C58.91 58.7554 57.4146 57.26 55.57 57.26C53.7253 57.26 52.23 58.7554 52.23 60.6C52.23 62.4446 53.7253 63.94 55.57 63.94Z" fill="#D2D2D2"/>
                  <path d="M66.06 63.94C67.9046 63.94 69.4 62.4446 69.4 60.6C69.4 58.7554 67.9046 57.26 66.06 57.26C64.2153 57.26 62.72 58.7554 62.72 60.6C62.72 62.4446 64.2153 63.94 66.06 63.94Z" fill="#D2D2D2"/>
                  <path d="M92.7 72.3101H38.34C36.2248 72.3101 34.51 74.0248 34.51 76.1401V87.7701C34.51 89.8853 36.2248 91.6001 38.34 91.6001H92.7C94.8153 91.6001 96.53 89.8853 96.53 87.7701V76.1401C96.53 74.0248 94.8153 72.3101 92.7 72.3101Z" fill="white" stroke="#BABABA" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M45.07 85.32C46.9146 85.32 48.41 83.8246 48.41 81.98C48.41 80.1354 46.9146 78.64 45.07 78.64C43.2253 78.64 41.73 80.1354 41.73 81.98C41.73 83.8246 43.2253 85.32 45.07 85.32Z" fill="#D2D2D2"/>
                  <path d="M55.57 85.32C57.4146 85.32 58.91 83.8246 58.91 81.98C58.91 80.1354 57.4146 78.64 55.57 78.64C53.7253 78.64 52.23 80.1354 52.23 81.98C52.23 83.8246 53.7253 85.32 55.57 85.32Z" fill="#D2D2D2"/>
                  <path d="M66.06 85.32C67.9046 85.32 69.4 83.8246 69.4 81.98C69.4 80.1354 67.9046 78.64 66.06 78.64C64.2153 78.64 62.72 80.1354 62.72 81.98C62.72 83.8246 64.2153 85.32 66.06 85.32Z" fill="#D2D2D2"/>
                  <path d="M97.6199 53.8999C109.069 53.8999 118.35 44.6188 118.35 33.1699C118.35 21.7211 109.069 12.4399 97.6199 12.4399C86.171 12.4399 76.8899 21.7211 76.8899 33.1699C76.8899 44.6188 86.171 53.8999 97.6199 53.8999Z" fill="white" stroke="#BABABA" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M112.34 48.21L117.86 53.73" stroke="#BABABA" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M117.243 51.0502L115.53 52.8428C114.759 53.6493 114.788 54.9279 115.594 55.6988L130.485 69.9336C131.291 70.7045 132.57 70.6757 133.341 69.8693L135.054 68.0766C135.825 67.2702 135.796 65.9915 134.99 65.2206L120.099 50.9859C119.293 50.215 118.014 50.2438 117.243 51.0502Z" fill="white" stroke="#BABABA" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
  
              <div className="flex flex-col items-center space-y-3">
                  <p className="text-2xl text-[#939090]">No Data</p>
                  <p className="text-lg text-[#939090]">There is no data to show you right now</p>
              </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}

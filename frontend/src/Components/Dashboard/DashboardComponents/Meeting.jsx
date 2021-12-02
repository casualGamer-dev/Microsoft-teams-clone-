/**
 * Dashboard Meeting component
 * @param [Meeting component] {user} user detail to fetch team and meeting details
 * @description allows to schedule/start meeting
 * @returns list of scheduled meetings in chronological order
 * [note] .onSnapshot on firebase references will allow realtime changes to reflect for the user
 */

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import firebase from "firebase";
import { Redirect } from 'react-router-dom';
import { userRef, teamsRef } from "../../../Helper/Firebase";
import { createRoom } from '../../../Helper/RoomHelper';
import ScheduledMeeting from './ScheduleMeeting.jsx';
import meet1 from '../../../Assets/illust/meet-1.svg';
import meet2 from '../../../Assets/illust/meet-2.svg';
import "../Dashboard.css";

const Meeting = ({ user }) => {

  //variables for current meetings and new meetings
  const [meetings, setMeetings] = useState([]);
  const [redirect, setRedirect] = useState(null);
  const [schedule, setSchedule] = useState({
    name: '',
    time: null,
    agenda: '',
    room: '',
    team: ''
  });

  const [teams, setTeams] = useState([]);
  const [myTeams, setMyTeams] = useState([]);

  const { name, agenda, team } = schedule;
  const { uid } = user && user;

  let currentSeconds = new Date().getTime();
  currentSeconds = currentSeconds / 1000 - 3600;

  let currentDate = new Date().toISOString();

  useEffect(() => {
    setMyTeams([]);
    //fetch my teams
    userRef.doc(uid).get()
    .then((doc) => {
      if (doc.exists) {
        setMyTeams(doc.data().teams)
      }
    })
  }, [uid]);

  //update and display my scheduled meetings
  useEffect(() => {
    setTeams([])
    setMeetings([])
    teamsRef.get().then((doc) => {
      doc.forEach(item => {
        if (item.exists && myTeams.includes(item.id)) {
          setTeams(e => [...e, {data: item.data(), id: item.id} ])
          if (item.data().meeting) {
            item.data().meeting.map(meet => {
              setMeetings(e => [...e, { meet: meet, team: item.data().name }])
            })
          }
        }
      })
    })
  }, [myTeams])

  //start an instant meetinf handler
  const redirectToRoom = async (e) => {
    e.preventDefault();
    createRoom()
    .then(res => {
      toast.info('Joining room ...');
      setRedirect(res);
    })
    .catch(err => toast.error('Error creating room ...'))
  }

  //join meeting handler
  const joinRedirect = async (e) => {
    e.preventDefault();
    let id = document.getElementById('join-meet-code').value;
    if (id) {
      toast.info('Joining room ...');
      return setRedirect(id);
    }
    else toast.warning('Wrong code');
  };

  const inputHandler = (e, property) => {
    if (property == 'time') {
      setSchedule({...schedule, [property]: new Date(e.target.value).getTime()/1000});
    } else {
      setSchedule({...schedule, [property]: e.target.value});
    }
  }

  //update teams database for meeting
  const scheduleMeeting = async () => {
    let token = await createRoom();
    if (token && schedule.team) {
      await teamsRef.doc(schedule.team).update({
        meeting: firebase.firestore.FieldValue.arrayUnion({
          agenda: schedule.agenda,
          token: token,
          time: schedule.time,
          name: schedule.name
        })
      }).then(() => toast.success('Meeting scheduled.'))
      setMeetings(e => [...e,{ meet: {
        agenda: schedule.agenda,
        token: token,
        time: schedule.time,
        name: schedule.name
      }, team: schedule.team }]);
    } else {
      toast.error('Error scheduling meeting!')
    }
    setSchedule({ name: '', agenda: '', room: '' })
  }

  return (
    <div className="db-comp-parent">
      { 
        redirect != null && redirect.length > 0 ? 
        <Redirect to={{ pathname: "/room/" + redirect }} /> 
        : null 
      }
      <div className="db-comp-nav">
        <h2>Meetings</h2>
        <hr />

        <div>
          <h4>Your scheduled meetings</h4>
          <div>
            {
              meetings && meetings.sort((a,b) => {
                return a.meet.time - b.meet.time;
              }).map(item => {
                if (item.meet && (item.meet.time > currentSeconds)) {
                  return <ScheduledMeeting meets={item} />
                } else return null;
              })
            }
          </div>
        </div>
      </div>
      
      <div className="db-comp-main">

        <div className='db-comp-meeting'>
          <img src={meet2} alt='image' />
          <button onClick={(e) => redirectToRoom(e)} style={{backgroundColor: 'var(--accentColor)'}}> Start an instant meeting </button> 
          <h6> -- OR --</h6>
          <input placeholder='Enter the code you recieved' id='join-meet-code' />
          <button onClick={(e) => joinRedirect(e)} style={{backgroundColor: 'limegreen'}} >Join</button>
        </div>

        <div className='db-comp-meeting'>
          <img src={meet1} alt='image' />
          <select value={team} onChange={(e) => inputHandler(e, 'team')}>
            <option>Please select team</option>
            {
              teams && teams.map((item, index) => <option value={item.id && item.id} key={index}> {item.data.name && item.data.name} </option>)
            }
          </select>
          <input type='datetime-local' min={currentDate.substr(0,16)} onChange={(e) => inputHandler(e, 'time')} />
          <input placeholder='Meeting name' value={name} onChange={(e) => inputHandler(e, 'name')} />
          <input placeholder='Meeting agenda' value={agenda} onChange={(e) => inputHandler(e, 'agenda')} />   
          <button onClick={(e) => scheduleMeeting(e)}> Schedule Meeting </button>
        </div>

      </div>
    </div>
  );
};

export default Meeting;

import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  PermissionsAndroid,
  TouchableHighlight,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  TwilioVideoLocalView, // to get local view
  TwilioVideoParticipantView, //to get participant view
  TwilioVideo,
} from 'react-native-twilio-video-webrtc';
// NOTE :
// make sure you install vector icons and its dependencies
//
import MIcon from 'react-native-vector-icons/MaterialIcons';
import normalize from 'react-native-normalize';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import axios from 'axios';
export async function GetAllPermissions() {
  // it will ask the permission for user
  try {
    // if (Platform.OS === "android") {
    const userResponse = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ]);
    return userResponse;
    // }
  } catch (err) {
    console.log(err);
  }
  return null;
}

const API = `https://video-service-api.herokuapp.com/api`;

export default class Example extends Component {
  state = {
    isAudioEnabled: true,
    isVideoEnabled: true,
    isButtonDisplay: true,
    status: 'disconnected',
    participants: new Map(),
    videoTracks: new Map(),
    roomName: '',
    user: '',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTSzk2YzY0ZTAwMGNhYjQxOWE0ODExMjcxNmVjYTI4Mzg4LTE2MjE4NDE0NjkiLCJncmFudHMiOnsiaWRlbnRpdHkiOiIxMjM0NiIsInZpZGVvIjp7InJvb20iOiJmaXJzdFJvb20ifX0sImlhdCI6MTYyMTg0MTQ2OSwiZXhwIjoxNjIxODQ1MDY5LCJpc3MiOiJTSzk2YzY0ZTAwMGNhYjQxOWE0ODExMjcxNmVjYTI4Mzg4Iiwic3ViIjoiQUM4Yzk4YjY4YTVmNTQ3ZDNlOGM5NzFiZmQwZGYyOTNkZSJ9.ZuuCvYW4fqeFrn_6_dQvDiMoL-66-RYLtlPN6yFOW5Y',
    loader: false,
  };
  getTokenFromServer = () => {
    //userId / userName but must be unique
    let userName = `${this.state.user} + ${new Date().getTime()} + ${Math.floor(
      Math.random() * 10,
    )}`;
    return axios
      .post(`${API}/token/${userName}`, {
        roomName: this.state.roomName,
      })
      .then(response => response.data)
      .catch(({response}) => response);
  };
  componentDidMount() {
    // on start we are asking the permisions
    GetAllPermissions();
  }
  _onConnectButtonPress = () => {
    let name = this.state.user.trim();
    if (name.length <= 3) {
      Alert.alert('Error', 'User name must be atleast 3 char');
      return;
    }
    this.setState({...this.state, loader: true});
    console.log('in on connect button preess');
    this.getTokenFromServer()
      .then(response => {
        this.refs.twilioVideo.connect({
          roomName: this.state.roomName,
          accessToken: response.token,
        });

        this.setState({...this.state, loader: false});
        this.setState({status: 'connecting'});
        console.log(this.state.status);
      })
      .catch(error => console.error(error));
  };
  _onEndButtonPress = () => {
    this.refs.twilioVideo.disconnect();
  };
  _onMuteButtonPress = () => {
    // on cliking the mic button we are setting it to mute or viceversa
    this.refs.twilioVideo
      .setLocalAudioEnabled(!this.state.isAudioEnabled)
      .then(isEnabled => this.setState({isAudioEnabled: isEnabled}));
  };
  _onFlipButtonPress = () => {
    // switches between fronst camera and Rare camera
    this.refs.twilioVideo.flipCamera();
  };
  _onRoomDidConnect = () => {
    console.log('room did connected');
    this.setState({status: 'connected'});
  };
  _onRoomDidDisconnect = ({roomName, error}) => {
    console.log('ERROR: ', JSON.stringify(error));
    console.log('disconnected');
    this.setState({status: 'disconnected'});
  };
  _onRoomDidFailToConnect = error => {
    console.log('ERROR: ', JSON.stringify(error));
    console.log('failed to connect');
    this.setState({status: 'disconnected'});
  };
  _onParticipantAddedVideoTrack = ({participant, track}) => {
    // call everytime a participant joins the same room
    console.log('onParticipantAddedVideoTrack: ', participant, track);
    this.setState({
      videoTracks: new Map([
        ...this.state.videoTracks,
        [
          track.trackSid,
          {participantSid: participant.sid, videoTrackSid: track.trackSid},
        ],
      ]),
    });

    console.log('this.state.videoTracks', this.state.videoTracks);
  };
  _onParticipantRemovedVideoTrack = ({participant, track}) => {
    // gets called when a participant disconnects.
    console.log('onParticipantRemovedVideoTrack: ', participant, track);
    const videoTracks = this.state.videoTracks;
    videoTracks.delete(track.trackSid);
    this.setState({videoTracks: {...videoTracks}});
  };
  render() {
    return (
      <View style={styles.container}>
        {this.state.status === 'disconnected' && (
          <View>
            <Text style={styles.welcome}>Welcome to Quick VC 😊😃</Text>
            <View style={styles.spacing}>
              <Text style={styles.inputLabel}>User Name</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="User Name / user Id"
                defaultValue={this.state.user}
                onChangeText={text => this.setState({user: text})}
              />
            </View>
            <View style={styles.spacing}>
              <Text style={styles.inputLabel}>Room Name</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="Room Name"
                defaultValue={this.state.roomName}
                onChangeText={text => this.setState({roomName: text})}
              />
            </View>

            {/* <View style={styles.spacing}>
              <Text style={styles.inputLabel}>Token</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="Token"
                defaultValue={this.state.token}
                onChangeText={text => this.setState({token: text})}
              />
            </View> */}
            {this.state.loader ? (
              <TouchableHighlight
                style={[styles.buttonContainer, styles.loginButton]}
                onPress={() => {}}>
                <Text style={styles.Buttontext}>
                  <ActivityIndicator color="white" />
                </Text>
              </TouchableHighlight>
            ) : (
              <TouchableHighlight
                style={[styles.buttonContainer, styles.loginButton]}
                onPress={this._onConnectButtonPress}>
                <Text style={styles.Buttontext}>Connect</Text>
              </TouchableHighlight>
            )}
          </View>
        )}
        {(this.state.status === 'connected' ||
          this.state.status === 'connecting') && (
          <View style={styles.callContainer}>
            {this.state.status === 'connected' && (
              <View style={styles.remoteGrid}>
                <TouchableOpacity
                  style={styles.remoteVideo}
                  onPress={() => {
                    this.setState({
                      isButtonDisplay: !this.state.isButtonDisplay,
                    });
                  }}>
                  {Array.from(
                    this.state.videoTracks,
                    ([trackSid, trackIdentifier]) => {
                      return (
                        <TwilioVideoParticipantView
                          style={styles.remoteVideo}
                          key={trackSid}
                          trackIdentifier={trackIdentifier}
                        />
                      );
                    },
                  )}
                </TouchableOpacity>
                <TwilioVideoLocalView
                  enabled={true}
                  style={
                    this.state.isButtonDisplay
                      ? styles.localVideoOnButtonEnabled
                      : styles.localVideoOnButtonDisabled
                  }
                />
              </View>
            )}
            <View
              style={{
                display: this.state.isButtonDisplay ? 'flex' : 'none',
                position: 'absolute',
                left: 0,
                bottom: 0,
                right: 0,
                height: 100,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-evenly',
                // backgroundColor:"blue",
                // zIndex: 2,
                zIndex: this.state.isButtonDisplay ? 2 : 0,
              }}>
              <TouchableOpacity
                style={{
                  display: this.state.isButtonDisplay ? 'flex' : 'none',
                  width: 60,
                  height: 60,
                  marginLeft: 10,
                  marginRight: 10,
                  borderRadius: 100 / 2,
                  backgroundColor: 'grey',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={this._onMuteButtonPress}>
                <MIcon
                  name={this.state.isAudioEnabled ? 'mic' : 'mic-off'}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  display: this.state.isButtonDisplay ? 'flex' : 'none',
                  width: 60,
                  height: 60,
                  marginLeft: 10,
                  marginRight: 10,
                  borderRadius: 100 / 2,
                  backgroundColor: 'grey',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={this._onEndButtonPress}>
                {/* <Text style={{fontSize: 12}}>End</Text> */}
                <MIcon name="call-end" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  display: this.state.isButtonDisplay ? 'flex' : 'none',
                  width: 60,
                  height: 60,
                  marginLeft: 10,
                  marginRight: 10,
                  borderRadius: 100 / 2,
                  backgroundColor: 'grey',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={this._onFlipButtonPress}>
                {/* <Text style={{fontSize: 12}}>Flip</Text> */}
                <MCIcon name="rotate-3d" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        <TwilioVideo
          ref="twilioVideo"
          onRoomDidConnect={this._onRoomDidConnect}
          onRoomDidDisconnect={this._onRoomDidDisconnect}
          onRoomDidFailToConnect={this._onRoomDidFailToConnect}
          onParticipantAddedVideoTrack={this._onParticipantAddedVideoTrack}
          onParticipantRemovedVideoTrack={this._onParticipantRemovedVideoTrack}
        />
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    // alignItems: 'center',
    justifyContent: 'center',
  },
  callContainer: {
    flex: 1,
    position: 'absolute',
    bottom: 0,
    top: 0,
    left: 0,
    right: 0,
    minHeight: '100%',
  },
  welcome: {
    fontSize: 23,
    textAlign: 'center',
    paddingTop: '4%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    marginRight: 70,
    marginLeft: 70,
    marginTop: 50,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  button: {
    marginTop: 100,
  },
  localVideoOnButtonEnabled: {
    bottom: '40%',
    width: '35%',
    left: '64%',
    height: '25%',
    zIndex: 2,
  },
  localVideoOnButtonDisabled: {
    bottom: '30%',
    width: '35%',
    left: '64%',
    height: '25%',
    zIndex: 2,
  },
  remoteGrid: {
    flex: 1,
    flexDirection: 'column',
  },
  remoteVideo: {
    width: wp('100%'),
    height: hp('100%'),
    zIndex: 1,
  },
  optionsContainer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    zIndex: 2,
  },
  optionButton: {
    width: 60,
    height: 60,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 100 / 2,
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacing: {
    padding: 10,
  },
  inputLabel: {
    fontSize: 18,
  },
  buttonContainer: {
    height: normalize(45),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: wp('90%'),
    borderRadius: 30,
  },
  loginButton: {
    backgroundColor: '#1E3378',
    width: wp('90%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
    marginTop: 10,
  },
  Buttontext: {
    color: 'white',
    fontWeight: '500',
    fontSize: 18,
  },
  inputBox: {
    borderBottomColor: '#cccccc',
    fontSize: 16,
    width: wp('95%'),
    borderBottomWidth: 1,
  },
});
// FRIENDLY NAME
// RN

// SID
// SK96c64e000cab419a48112716eca28388

// KEY TYPE
// Standard

// SECRET
// NStABqRQA5KXWdOUyQL2SzEYuwy50pKs

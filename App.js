import React, {useEffect} from 'react';
import {StyleSheet, View, Button} from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const BACKGROUND_LOCATION = 'BACKGROUND_LOCATION';
const GEOFENCE_BOUNDARY = 'GEOFENCE_BOUNDARY';

const geofence = {
  latitude: 22.706141,
  longitude: 100.384468,
  radius: 500, // 500 meters
};

TaskManager.defineTask(
  GEOFENCE_BOUNDARY,
  ({data: {eventType, region}, error}) => {
    if (error) {
      console.log(error.message, 'geofence error');
      return;
    }
    if (eventType === Location.GeofencingEventType.Enter) {
      console.log("You've entered region:", region);
    } else if (eventType === Location.GeofencingEventType.Exit) {
      console.log("You've left region:", region);
    }
  },
);

TaskManager.defineTask(BACKGROUND_LOCATION, async ({data, error}) => {
  if (error) {
    console.error(error.message, 'background location error');
    return;
  }
  if (data) {
    const {locations} = data;
    const location = locations[0];
    if (location) {
      console.log('Location in background', location.coords);
      const isTaskDefined = TaskManager.isTaskDefined(GEOFENCE_BOUNDARY);
      if (!isTaskDefined) {
        console.log('Task is not defined');
        return;
      }
      await Location.startGeofencingAsync(GEOFENCE_BOUNDARY, [
        {
          identifier: 'my-geofence',
          latitude: geofence.latitude,
          longitude: geofence.longitude,
          radius: geofence.radius,
          notifyOnEnter: true,
          notifyOnExit: true,
        },
      ]);
    }
  }
});

export default function App() {
  useEffect(() => {
    const requestPermissions = async () => {
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (foreground.granted)
        await Location.requestBackgroundPermissionsAsync();
    };
    requestPermissions();
  }, []);

  // // Start location tracking in background
  const startBackgroundUpdate = async () => {
    // Don't track position if permission is not granted
    const {granted} = await Location.getBackgroundPermissionsAsync();
    if (!granted) {
      console.log('location tracking denied');
      return;
    }

    // Make sure the task is defined otherwise do not start tracking
    const isTaskDefined = TaskManager.isTaskDefined(BACKGROUND_LOCATION);
    if (!isTaskDefined) {
      console.log('Task is not defined');
      return;
    }

    // Don't track if it is already running in background
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION,
    );
    if (hasStarted) {
      console.log('Already started');
      return;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 20000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Location',
        notificationBody: 'Location tracking in background',
        notificationColor: '#fff',
      },
    });
  };

  const stopBackgroundUpdate = async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION,
    );
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION);
      console.log('Location tacking stopped');
    }
    if (Location.hasStartedGeofencingAsync) {
      Location.stopGeofencingAsync(GEOFENCE_BOUNDARY);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        onPress={startBackgroundUpdate}
        title="Start in background"
        color="green"
      />
      <Button
        onPress={stopBackgroundUpdate}
        title="Stop background"
        color="red"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    marginTop: 15,
  },
  separator: {
    marginVertical: 8,
  },
});

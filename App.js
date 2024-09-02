import { useState } from 'react';
import { StyleSheet, View, FlatList, Button } from 'react-native';
import { StatusBar } from "expo-status-bar/build/StatusBar";
import GoalItem from "./components/GoalItem";
import GoalInput from "./components/GoalInput";

export default function App() {
    const [modalIsVisible, setModalIsVisible] = useState([]);
    const [courseGoals, setCourseGoals] = useState([]);

    function startAddGoalHandler() {
        setModalIsVisible(true);
    }
    function endAddGoalHandler() {
        setModalIsVisible(false);
    }
    function addGoalHandler(enteredGoalText) {
        setCourseGoals((currentCourseGoals) => [...courseGoals, {text: enteredGoalText, id: Math.random().toString()}]);
    }

    function deleteGoalHandler(id){
       setCourseGoals(currentCourseGoals => {return currentCourseGoals.filter((goal) => goal.id !== id)});
    }

  return (
  <>
  <StatusBar style='light'/>
    <View style={styles.appContainer}>
        <Button title='Add new Goal!' color="#5e0acc" onPress={startAddGoalHandler}/>
      <GoalInput visible={modalIsVisible} onCancel={endAddGoalHandler} onAddGoal={addGoalHandler}/>
        <View style={styles.goalsContainer}>
      <FlatList data={courseGoals} renderItem={(itemData) => { return <GoalItem text={itemData.item.text} id={itemData.item.id} onDeleteItem={deleteGoalHandler}/>}} keyExtractor={(item, index) => {return item.id}}/>
        </View>
    </View>
  </>
  );
}

const styles = StyleSheet.create({
    appContainer: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 50
    },
    goalsContainer: {
          flex: 4
    }
});

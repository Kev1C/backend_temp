// frontend/screens/Home/ResourcesScreenStyles.js

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // backgroundColor handled by theming
  },
  list: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    // borderColor handled dynamically
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    // color handled dynamically
  },
  link: {
    marginTop: 5,
    fontSize: 16,
    // color handled dynamically
    textDecorationLine: 'underline',
  },
});

export default styles;
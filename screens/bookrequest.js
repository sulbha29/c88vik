import React ,{Component} from 'react'
import {View,StyleSheet,TextInput,TouchableOpacity, Alert,Text,Modal,ScrollView, KeyboardAvoidingView,TouchableHighlight,FlatList,Image} from 'react-native'
import firebase from 'firebase'
import db from '../config'
import Myheader from '../components/myheader'
import { BookSearch } from "react-native-google-books";

import { SearchBar, ListItem, Input } from "react-native-elements";

export default class BookRequest extends Component{
    constructor(){
        super()
        this.state={
            emailid:firebase.auth().currentUser.email,
            bookname:"",
            reason:"",
            requestid:"",
            bookstatus:"",
            isbookrequestactive:"",
            userdocid:"",
            docid:"",
            requestedbookname:"",
            imagelink:"#",
            datasource:"",
            showflatlist:false,
            requestedImageLink: "",

        }
    }
    createUniqueId(){
        return Math.random().toString(36).substring(7)
    }
    Addrequest=async(bookname,reason)=>{
        var emailid = this.state.emailid;
        var requestid = this.createUniqueId();
        var books = await BookSearch.searchbook(bookname,"AIzaSyC-6-ddQFn_Ag5U_3TApCPfQng3MGIx5cg")
        db.collection("requestbooks").add({emailid:emailid,bookname:bookname,reason:reason,requestid:requestid,bookstatus:"requested",date:firebase.firestore.FieldValue.serverTimestamp(),imagelink:books.data[0].volumeInfo.imageLinks.smallThumbnail})
     await this.getbookrequest()
        db.collection("user").where("emailid","==",emailid).get().then().then((snapshot)=>{
            snapshot.forEach((doc)=>{db.collection("user").doc(doc.id).update({isbookrequestactive:true})})
        })
        
        this.setState({bookname:"",reason:"",requestid:requestid})
        return(
            Alert.alert("Book Requested Successfully")
        )
    }
    receivebook=(bookname)=>{
        var emailid = this.state.emailid
        var requestid = this.state.requestid;
        db.collection("receivedbooks").add({emailid:emailid,bookname:bookname,requestid:requestid,bookstatus:"received"})
    }
    getrequeststatus(){
        db.collection("user").where("emailid","==",this.state.emailid).onSnapshot(querysnapshot=>
            {querysnapshot.forEach(doc=>{this.setState({isbookrequestactive:doc.data().isbookrequestactive,userdocid:doc.id})})})
    }
    getbookrequest=()=>{
        var bookrequest= db.collection("requestbooks").where("emailid","==",this.state.emailid).get().then((snapshot)=>{
            snapshot.forEach((doc)=>{if(doc.data().bookstatus !== "received"){
                this.setState({requestid:doc.data().requestid,requestedbookname:doc.data().bookname,bookstatus:doc.data().bookstatus,docid:doc.id,requestedImageLink: doc.data().imagelink})
            }})
        })
    }
    sendNotification=()=>{
        //to get the first name and last name
        db.collection('user').where('emailid','==',this.state.emailid).get()
        .then((snapshot)=>{
          snapshot.forEach((doc)=>{
            var name = doc.data().firstname
            var lastName = doc.data().lastname
      
            // to get the donor id and book nam
            db.collection('allnotifications').where('requestid','==',this.state.requestid).get()
            .then((snapshot)=>{
              snapshot.forEach((doc) => {
                var donorId  = doc.data().donorid
                var bookName =  doc.data().bookname
      
                //targert user id is the donor id to send notification to the user
                db.collection('allnotifications').add({
                  "targeteduserid" : donorId,
                  "message" : name +" " + lastName + " received the book " + bookName ,
                  "notificationstatus" : "unread",
                  "bookname" : bookName
                })
              })
            })
          })
        })
      }
    
      componentDidMount(){
        this.getrequeststatus();
        this.getbookrequest();
    }
    updaterequeststatus=()=>{
        db.collection("requestbooks").doc(this.state.docid).update({bookstatus:"received"})
        db.collection("user").where("emailid","==",this.state.emailid).get().then((snapshot)=>{
            snapshot.forEach((doc)=>{db.collection("user").doc(doc.id).update({isbookrequestactive:false})})
        })
    }
    
    async getrequestbookname(bookname){
        this.setState({bookname:bookname})
        if(bookname.lenght>2){
            var books = await BookSearch.searchbook(bookname,"AIzaSyC-6-ddQFn_Ag5U_3TApCPfQng3MGIx5cg")
            this.setState({datasource:books.data,showflatlist:true})
        }

    }
    renderItem=({item,i})=>{
        console.log("image link ");
        let obj = {
            title: item.volumeInfo.title,
            selfLink: item.selfLink,
            buyLink: item.saleInfo.buyLink,
            imageLink: item.volumeInfo.imageLinks,
          };
        return(
            <TouchableHighlight 
            style={{alignItems:"center",
            backgroundColor:"blue",
            width:"90%"}} 
            activeOpacity={0.5}
             underlayColor="black" 
             onPress={()=>{
                this.setState({showflatlist:false,
                    bookname:item.volumeInfo.title})
            }}
            bottomDivider
            ><Text>{item.volumeInfo.title}</Text>
            </TouchableHighlight>
        )
    }
   
   
   
    
    
    render(){
        if(this.state.isbookrequestactive===true){
        return(

            <View style = {{flex:1,justifyContent:'center'}}>
     
                <View style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}>
                <Text>Book Name</Text>
                <Text>{this.state.requestedbookname}</Text>
                </View>
                <View style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}>
                    <Text>
                        Book Status
                    </Text>
                    <Text>
                        {this.state.bookstatus}
                    </Text>
                </View>
                <TouchableOpacity onPress={()=>{
                    this.updaterequeststatus();
                    this.receivebook(this.state.requestedbookname)
                this.sendNotification()
    }}><Text>I Received the book</Text></TouchableOpacity>
                </View>
        )
        }
        else{
            return(

            <View style={{flex:1}}>
               <Myheader title="Requestbooks" navigation ={this.props.navigation}/>
               
                   <View>
                   <TextInput style={styles.formTextinput}
                   placeholder={"Enter Book Name"}
                   onChangeText={text=>{this.getrequestbookname(text) }}
                   onClear = {text=>this.getrequestbookname("")}        
                 

                   value={this.state.bookname}
                   />
                   
                   {this.state.showflatlist ? (
                   <FlatList  
                   data={this.state.datasource} 
                   renderItem={this.renderItem} 
                   enableEmptySections={true}
                   style={{ marginTop: 10 }}
                   keyExtractor={(item,index)=>index.toString()}
                   />):
                   (<View style={{alignItems:"center"}}>
                     <TextInput style={styles.formTextinput}
                   placeholder={"Reason"}
                   multiline
                   numberOfLines={7}
                   onChangeText={(text)=>{
                    this.setState({reason:text})
                   }}
                   value={this.state.reason}
                   />
                   <TouchableOpacity style={styles.button} onPress={()=>{this.Addrequest(this.state.bookname,this.state.reason)}}><Text>Request</Text></TouchableOpacity>
                   </View>)
                }</View>
            </View>
        

        )
    }
}
    
    }
    const styles = StyleSheet.create({ keyBoardStyle : { flex:1, alignItems:'center', justifyContent:'center' },
     formTextInput:{ width:"75%", height:35, alignSelf:'center', borderColor:'#ffab91', borderRadius:10, borderWidth:1, marginTop:20, padding:10, },
      button:{ width:"75%", height:50, justifyContent:'center', alignItems:'center', borderRadius:10, backgroundColor:"#ff5722", shadowColor: "#000", 
      shadowOffset: { width: 0, height: 8, }, 
      shadowOpacity: 0.44, shadowRadius: 10.32, elevation: 16, marginTop:20 },
      ImageView:{
        flex: 0.3,
        justifyContent: "center",
        alignItems: "center",
        marginTop:20
      },
      imageStyle:{
        height: 50,
        width: 50,
        alignSelf: "center",
        borderWidth: 5,
        borderRadius: 10,
      },
      bookstatus:{
        flex: 0.4,
        alignItems: "center",
    
      },
    
    } )
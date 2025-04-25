using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace mis_221_pa_5_cpclemons
{
    public class Order
    {

        //Fields
        private int orderID;
        private string email;
        private int pizzaID;
        private int drinkID;
        private string drinkSize;
        private string orderDate;
        private int pizzaSize;
        private bool orderStatus;
        private static int count;

        //Default Constructor
        public Order(){

        }

        //Constructor
        public Order(int orderID, string email, int pizzaID, int drinkID, string drinkSize, string orderDate, int pizzaSize, bool orderStatus){
            this.orderID = orderID;
            this.email = email;
            this.pizzaID = pizzaID;
            this.drinkID = drinkID;
            this.drinkSize = drinkSize;
            this.orderDate = orderDate;
            this.pizzaSize = pizzaSize;
            this.orderStatus = orderStatus;
        }

        //Getters
        public int GetOrderID(){
            return orderID;
        }
        public string GetEmail(){
            return email;
        }
        public int GetPizzaID(){
            return pizzaID;
        }
        public int GetDrinkID(){
            return drinkID;
        }
        public string GetDrinkSize(){
            return drinkSize;
        }
        public string GetOrderDate(){
            return orderDate;
        }
        public int GetPizzaSize(){
            return pizzaSize;
        }
        public bool GetOrderStatus(){
            return orderStatus;
        }

        //Setters
        public void SetOrderID(int orderID){
            this.orderID = orderID;
        }
        public void SetEmail(string email){
            this.email = email;
        }
        public void SetPizzaID(){
            this.pizzaID = pizzaID;
        }
        public void SetDrinkID(){
            this.drinkID = drinkID;
        }
        public void SetDrinkSize(string drinkSize){
            this.drinkSize = drinkSize;
        }
        public void SetOrderDate(string orderDate){
            this.orderDate = orderDate;
        }
        public void SetPizzaSize(int pizzaSize){
            this.pizzaSize = pizzaSize;
        }
        public void SetOrderStatus(bool orderStatus){
            this.orderStatus = orderStatus;
        }

        //Other methods
        public static int GetCount(){
            return count;
        }
        public static void SetCount(int count){
            Order.count = count;
        }
        public static void IncCount(){
            count++;
        }
        public override string ToString()
        {
            return $"Order ID: {orderID}\tEmail: {email}\tPizza ID: {pizzaID}\tDrink ID: {drinkID}\tDrink Size: {drinkSize}\tOrder Date: {orderDate}\tPizza Size: {pizzaSize}\tOrder Status: {orderStatus}"; 
        }
        public string ToFile(){
            return $"{orderID}#{email}#{pizzaID}#{drinkID}#{drinkSize}#{orderDate}#{pizzaSize}#{orderStatus}";
        }
    }
}
    
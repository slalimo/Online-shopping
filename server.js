const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

let app= express();
app.use(bodyParser.json());

 async function connect() {
    try {
        await mongoose.connect('mongodb://0.0.0.0:27017/online', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 9000 // 9 seconds (not 30 seconds)
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
    }
}

connect();

 
const multer = require('multer');
const path = require ('path');
const { error } = require('console');
const { totalmem } = require('os');
//call back=>cb
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname,"../hanood") ); // Define folder for uploads
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

app.post("/pic", upload.single("pic"),(req,res)=>{
    res.status(200);
    res.json({message: "image uploaded"});
} )
module.exports = upload;

//schema(user(email,phone,address,cart),product(price,color,type),category,favoritproduct(price,color,type),)
 //user is collection
 // RES status code
// 200=>يبقا العمليه نجحت
// 400=>يبقا فى مشكله فى req 
// 500=>يبقا المشكله فى ال server
// Get All users (GET)
// Define a function to create models dynamically
function createModel(modelName, schemaDefinition) {
    const schema = new mongoose.Schema(schemaDefinition);
    return mongoose.model(modelName, schema);
}
// Define the schema for the user
const userSchemaDefinition = {
    name: String,
    email: {
        type: String,
        required: true,
        unique: [true, "this email is exist"]
    },
    password: String,
    phone: String,
    address: String,
};
// Create the user model dynamically
const userModel = createModel("User", userSchemaDefinition);
///signup
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Validate input data
        if (!name || !email || !password || !phone || !address) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Create a new user
        const newUser = await userModel.create({
            name,
            email,
            password,
            phone,
            address
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

                   //signin
app.post('/signin', async (req, res) => {
    try {
        const {  email, password } = req.body;
        // Validate input data
        if ( !email || !password ) {
            return res.status(400).json({ error: 'enter valid email & password' });
        }

        const result = await userModel.findOne({ email }).select("+password");

        if (!result || !(result.password == password) )
         {
          return res.status(401).json({ error: ' incorrect email or password' });
         }
        else{return res.status(201).json({ result })}
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


                //delete
async function deleteUser(req, res) {
    try {
        const userName = req.params.name;

        const deletedUser = await userModel.findOneAndDelete({ name: userName });

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found'});

        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' }); 
    }
}
app.delete('/users/:name', deleteUser);
  

            //update
async function updateUser(req, res) {
    try {

        const userData = req.body;

        const updatedUser = await userModel.findOneAndUpdate({ name: userData.name }, userData, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });     
    }
}
app.put('/users/:name', updateUser);

//  ///////////////////////////////////
const productSchema =new mongoose.Schema({
    price : String,
    describtion : String,
    color : String,
    id: Number,
    Image : String,
    isFavorite: { type: Boolean, default: false }
});
let productModel = new mongoose.model("product",productSchema);
            ///get
const getAllProducts = async (req, res) => {
    try {
        const allProducts = await productModel.find();
        res.status(200).json(allProducts);
        console.log(allProducts.length);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
app.get('/products', getAllProducts);
/////////post

app.post('/product', upload.single('image'),async (req, res) => {
    const imageUrl = req.file.path; 
    try {

        const newProduct = await productModel.create({
            price:req.body.price,
            describtion:req.body.describtion,
            color:req.body.color,
            id:req.body.id,
            imageUrl:req.body.imageUrl
          
        });

        res.status(201).json({ message: 'Product has been created', product: newProduct });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create product', error: error.message });
    }
});
    
  // Delete product by ID
app.delete('/products/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const deletedProduct = await productModel.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(202).json({ message: 'Product has been deleted', product: deletedProduct });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete product', error: error.message });
         console.log(error);
    }
});

// Update product by ID
app.put('/product/:productId', async (req, res) => {
    try {
        const productId = req.params.productId; 
        const updatedProduct = await productModel.findOneAndUpdate({ 
            
            price:req.body.price,
            describtion:req.body.describtion,
            color:req.body.color,
            id:req.body.id,
            imageUrl:req.body.imageUrl,
            isFavorite:req.body.isFavorite
            
             });
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(203).json({ message: 'Product has been updated', product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update product', error: error.message });
    }
});

//  ////////////////////////////////////////
const favoritproductSchema =new mongoose.Schema({
    price : String,
    describtion : String,
    color : String,
    id : Number,
    Image : String,
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
    isFavorite:{type:Boolean , default:true}
});
let favoritproductModel = new mongoose.model("favoritproduct",favoritproductSchema);

app.get('/favoritproduct', async (req, res) => {
    try {
        const allfavoritproduct = await favoritproductModel.find();
        res.status(200).json(allfavoritproduct);
        console.log(allfavoritproduct.length);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch favorit product', error: error.message });
    }
});

app.post('/favoritproduct', upload.single('image'),async (req, res) => {
   
    try {
        const { price, describtion, color, id, Image,product } = req.body;
        // const imageUrl = req.file.path; 
        const newfavoritproduct = await favoritproductModel.create({
            price,
            describtion,
            color,
            id,
            Image,
          product
        });

        res.status(201).json({ message: 'favoritproduct has been created', favoritproduct: newfavoritproduct });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create favoritproduct', error: error.message });
    }
});
    
  // Delete product by ID
app.delete('/favoritproduct/:favoritproductId', async (req, res) => {
    try {
        const favoritproductId = req.params.favoritproductId;
        const deleteFavoritProduct = await favoritproductModel.findByIdAndDelete(favoritproductId);

        if (!deleteFavoritProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(202).json({ message: 'Product has been deleted', product: deleteFavoritProduct });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete product', error: error.message });
         console.log(error);
    }
});

// Update product by ID
app.put('/favoritproduct/:favoritproductId', async (req, res) => {
    try {
        const updatedfavoritProduct = await favoritproductModel.findOneAndUpdate({ 
            
            price:req.body.price,
            describtion:req.body.describtion,
            color:req.body.color,
            id:req.body.id,
            imageUrl:req.body.imageUrl,
            isFavorite:req.body.isFavorite
            
             });
        if (!updatedfavoritProduct) {
            return res.status(404).json({ message: 'favoritProduct not found' });
        }

        res.status(203).json({ message: 'favoritProduct has been updated', favoritproduct: updatedfavoritProduct });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update favoritproduct', error: error.message });
    }
});


// /////////////////////////////////////
const categorySchema =new mongoose.Schema({
    name : String,
    product: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
});
let categoryModel = new mongoose.model("ctegory",categorySchema);

app.get('/category/:name', async (req, res) => {
    try {
        const categoryName = req.params.name;
        const category = await categoryModel.find({name: categoryName });  
        res.status(200).json(categoryName.length); 
        console.log(category.length); 
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch categories', error: error.message });    
    }
});

app.get('/category', async (req, res) => {
   
    let  allcategory = await categoryModel.find();
     res.status(200);
     res.json(allcategory);
     console.log (allcategory.length)
 })

 app.post('/category', async (req, res) => {
    try {
    
        const newCategory = await categoryModel.create({
            name:req.body.name,
            product:req.body.product
        });

        res.status(201).json({ message: 'Category has been created', category: newCategory });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create category', error: error.message });
        console.log(error);
    }
});

app.delete('/category/:name', async (req, res) => {
    const categoryName = req.params.name;
  
    try {
      const deletedCategory = await categoryModel.findOneAndDelete( {name : categoryName});
      if (!deletedCategory) {
        return res.status(404).json({ message: 'unknown category' });
      }
      res.status(200).json({ message: 'category has deleted', deletedCategory });
    } catch (error) {
      res.status(500).json({ message: ' cannot delete category    ', error });
      console.log(error);
    }
  });
app.put('/category/:id', async (req, res) => {
  const categoryId = req.params.id;
  const { name} = req.body;

  try {
    // Find the category by ID and update its fields
    const updatedCategory = await categoryModel.findByIdAndUpdate(categoryId, { name}, { new: true });

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category', error });
  }
});

// //////////////////////////////
const cartSchema =new mongoose.Schema({
    
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
   
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
     
        TotalPrice:String
      
});
let cartModel = new mongoose.model("cart",cartSchema);

app.post('/addTocart', async (req, res) => {
 
    try {
      const newcart = await cartModel.create({ 
        user: req.body.user,
        product: req.body.product,
        TotalPrice: req.body.totalPrice,

      });
      res.status(201).json(newcart);
    } catch (error) {
      res.status(500).json({ message: 'cannot add to cart', error });
      console.log(error);
    }
  });
app.get('/cart', async (req, res) => {
    let  cart = await cartModel.find();
     res.status(200);
     res.json(cart.allProducts);
     console.log (cart.length)
 })

 app.delete('/cart', async (req, res) => {  
    const productId = req.params.id;
    try {
      const deletedCart = await cartModel.findOneAndDelete( {product : productId});
      if (!deletedCart) {
        return res.status(404).json({ message: 'unknown cart' });
      }
      res.status(200).json({ message: 'cart has deleted', deletedCart });
    } catch (error) {
      res.status(500).json({ message: ' cannot delete cart    ', error });
      console.log(error);
    }
  });

  app.put('/cart', async (req, res) => {

    const productId = req.params.id;

    try {
      const updatedCart = await cartModel.findOneAndUpdate( { product : productId }, { new: true });
      if (!updatedCart) {
        return res.status(404).json({ message: 'unknown cart' });
      }
      res.status(200).json({ message: 'cart updated', updatedCart });
    } catch (error) {
      res.status(500).json({ message: ' cannot update cart    ', error });
      console.log(error);
    }
  });

// /////////////////////////////////
const reviewSchema =new mongoose.Schema({
    createdat : Date,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment : String,
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    user: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]
});
let reviewModel = new mongoose.model("review",reviewSchema);

 app.get('/reviews', async (req, res) => {
    let  allreview = await reviewModel.find();
     res.status(200);
     res.json(allreview);
     console.log (allreview.length)
 })

 app.get('/review/:id', async (req, res) => {
    const reviewId = req.params.id;
    try {
        const review = await reviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.status(200).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get review', error });
    }
});

 app.post('/review', async (req, res) => {
    try {
        const { createdat, rating, comment} = req.body;
        const newReview = await reviewModel.create({
            createdat,
            rating,
            comment,
            products: req.body.product,
            user: req.body.user,
        });
        res.status(201).json({ message: ' review created ', newReview});
    } catch (error) {
        res.status(500).json({ message: 'Failed to create review', error });
        console.log(error);
    }
});


app.delete('/review/:id', async (req, res) => {
    const reviewId = req.params.id;
    try {
        const deletedReview = await reviewModel.findByIdAndDelete(reviewId);
        if (!deletedReview) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete review', error });
    }
});

// Update a review
app.put('/review/:id', async (req, res) => {
    const reviewId = req.params.id;
    const { rating, comment } = req.body;
    try {
        const updatedReview = await reviewModel.findByIdAndUpdate(reviewId, { rating, comment }, { new: true });
        if (!updatedReview) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.status(200).json(updatedReview);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update review', error });
    }
});

app.listen(8080, function(){
        console.log('server now is opend ')
})

 
 

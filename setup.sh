echo "downloading the dictionary..."
curl https://blog.xjpvictor.info/wp-content/uploads/汉典.prc > zdic.prc

cd tools

echo "downloading dependencies..."
git clone https://github.com/kroo/mobi-python
cp -r mobi-python/mobi ./mobi
rm -rf mobi-python

echo "patching bugs in dependencies..."
chmod +x patch.py
./patch.py

echo "converting dictionary to txt... (this might take a while ~10 mins)"
chmod +x to_txt.py
./to_txt.py > ../zdic.txt

echo "converting txt to json..."
mkdir ../zdic_json
chmod +x to_json.py
./to_json.py

echo "done setting up!"
echo "to use the app, either run 'pkg .' to package into a binary, or run 'node index.js' directly."